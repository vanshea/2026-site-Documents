<?php
/**
 * Shared taxonomy and term helpers for REST controllers.
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_Term;

/**
 * Resolution and formatting helpers shared by the taxonomy, term and
 * object-term endpoints.
 *
 * A taxonomy is addressed by either its slug or its `rest_base`, because the two
 * frequently differ without any user customisation: core registers `category`
 * with the rest base `categories` and `post_tag` with `tags`, and ACF derives the
 * rest base from the taxonomy label. Accepting both removes a whole class of
 * failed first attempts.
 */
trait Taxonomy_Support {
	/**
	 * Upper bound on the number of terms fetched when building a term tree.
	 *
	 * A tree cannot be paginated meaningfully, so the whole taxonomy is loaded.
	 * Past this many terms the result is truncated and flagged as such rather
	 * than exhausting memory on a pathological taxonomy.
	 *
	 * @var int
	 */
	protected $tree_term_limit = 2000;

	/**
	 * Resolve a taxonomy from either its slug or its REST base.
	 *
	 * Only taxonomies exposed over the REST API are resolvable. A taxonomy
	 * registered without `show_in_rest` is indistinguishable from one that was
	 * never registered, which is why the caller must report the miss with
	 * `taxonomy_not_visible_response()` rather than as "does not exist".
	 *
	 * @param string $key Taxonomy slug or REST base.
	 * @return \WP_Taxonomy|null The taxonomy object, or null when it is not visible over REST.
	 */
	protected function resolve_taxonomy( $key ) {
		if ( ! is_string( $key ) || '' === $key ) {
			return null;
		}

		// Direct slug match.
		$taxonomy = get_taxonomy( $key );

		if ( $taxonomy && ! empty( $taxonomy->show_in_rest ) ) {
			return $taxonomy;
		}

		// Fall back to a REST base match.
		$taxonomies = get_taxonomies( array( 'show_in_rest' => true ), 'objects' );

		foreach ( $taxonomies as $candidate ) {
			if ( $this->get_taxonomy_rest_base( $candidate ) === $key ) {
				return $candidate;
			}
		}

		return null;
	}

	/**
	 * Get the REST base of a taxonomy, falling back to its slug.
	 *
	 * @param \WP_Taxonomy $taxonomy Taxonomy object.
	 * @return string The REST base.
	 */
	protected function get_taxonomy_rest_base( $taxonomy ) {
		return ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;
	}

	/**
	 * Build the 404 response for a taxonomy that cannot be resolved.
	 *
	 * Both possible causes are named on purpose. A taxonomy registered without
	 * `show_in_rest` is absent from every REST discovery route, so we genuinely
	 * cannot tell "never registered" from "registered but hidden", and claiming
	 * the former would be wrong half the time.
	 *
	 * @param string $key The taxonomy slug or REST base that was requested.
	 * @return WP_REST_Response
	 */
	protected function taxonomy_not_visible_response( $key ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'code'    => 'taxonomy_not_visible',
				'message' => sprintf(
					/* translators: %s is the requested taxonomy slug or REST base. */
					__( 'The taxonomy "%s" is not visible over the REST API. It may not exist, or it may exist without show_in_rest enabled. A developer can confirm which.', 'sg-ai-studio' ),
					$key
				),
			),
			404
		);
	}

	/**
	 * Get every taxonomy exposed over the REST API.
	 *
	 * @param string|null $post_type Optional post type slug to limit the result to.
	 * @return \WP_Taxonomy[] Taxonomy objects keyed by slug.
	 */
	protected function get_rest_visible_taxonomies( $post_type = null ) {
		if ( ! empty( $post_type ) ) {
			$taxonomies = get_object_taxonomies( $post_type, 'objects' );

			return array_filter(
				$taxonomies,
				function ( $taxonomy ) {
					return ! empty( $taxonomy->show_in_rest );
				}
			);
		}

		return get_taxonomies( array( 'show_in_rest' => true ), 'objects' );
	}

	/**
	 * Prepare a taxonomy object for the response.
	 *
	 * `terms_endpoint` is included so a caller that has just discovered the
	 * taxonomy does not have to assemble the route itself.
	 *
	 * @param \WP_Taxonomy $taxonomy Taxonomy object.
	 * @return array Prepared taxonomy data.
	 */
	protected function prepare_taxonomy_for_response( $taxonomy ) {
		$rest_base = $this->get_taxonomy_rest_base( $taxonomy );

		return array(
			'slug'           => $taxonomy->name,
			'name'           => $taxonomy->label,
			'description'    => $taxonomy->description,
			'hierarchical'   => (bool) $taxonomy->hierarchical,
			'rest_base'      => $rest_base,
			'rest_namespace' => ! empty( $taxonomy->rest_namespace ) ? $taxonomy->rest_namespace : 'wp/v2',
			'types'          => array_values( (array) $taxonomy->object_type ),
			'terms_endpoint' => '/' . $this->namespace . '/taxonomies/' . $taxonomy->name . '/terms',
		);
	}

	/**
	 * Prepare a term for the response.
	 *
	 * @param WP_Term $term Term object.
	 * @return array Prepared term data.
	 */
	protected function prepare_term_for_response( $term ) {
		$link = get_term_link( $term );

		return array(
			'id'          => (int) $term->term_id,
			'name'        => $term->name,
			'slug'        => $term->slug,
			'description' => $term->description,
			'parent'      => (int) $term->parent,
			'count'       => (int) $term->count,
			'taxonomy'    => $term->taxonomy,
			'link'        => is_wp_error( $link ) ? '' : $link,
		);
	}

	/**
	 * Rebuild parent nesting from a flat list of prepared terms.
	 *
	 * Terms whose parent is not part of the given set (for example when the set
	 * was filtered) are promoted to the top level rather than dropped, so the
	 * tree never loses a term.
	 *
	 * @param array $terms Prepared terms, as returned by prepare_term_for_response().
	 * @return array Top-level terms, each carrying a `children` array.
	 */
	protected function build_term_tree( $terms ) {
		$known    = array();
		$children = array();

		foreach ( $terms as $term ) {
			$known[ $term['id'] ] = true;
		}

		foreach ( $terms as $term ) {
			$parent = ( $term['parent'] > 0 && isset( $known[ $term['parent'] ] ) ) ? $term['parent'] : 0;

			$children[ $parent ][] = $term;
		}

		$emitted = array();
		$roots   = isset( $children[0] ) ? $children[0] : array();
		$tree    = $this->attach_term_children( $roots, $children, $emitted );

		// A cycle in the parent chain would leave terms unreachable from the root.
		// Surface them at the top level rather than silently dropping them.
		foreach ( $terms as $term ) {
			if ( ! isset( $emitted[ $term['id'] ] ) ) {
				$term['children'] = array();
				$tree[]           = $term;
			}
		}

		return $tree;
	}

	/**
	 * Recursively attach children to a set of term nodes.
	 *
	 * @param array $nodes    Prepared terms at the current level.
	 * @param array $children Map of parent term ID => prepared child terms.
	 * @param array $emitted  Term IDs already placed in the tree, by reference.
	 * @return array The nodes, each carrying a `children` array.
	 */
	private function attach_term_children( $nodes, $children, &$emitted ) {
		$out = array();

		foreach ( $nodes as $node ) {
			if ( isset( $emitted[ $node['id'] ] ) ) {
				continue;
			}

			$emitted[ $node['id'] ] = true;

			$node['children'] = isset( $children[ $node['id'] ] )
				? $this->attach_term_children( $children[ $node['id'] ], $children, $emitted )
				: array();

			$out[] = $node;
		}

		return $out;
	}

	/**
	 * Validate a proposed parent term, guarding against circular references.
	 *
	 * Generalised from the category-only check so it works for any hierarchical
	 * taxonomy.
	 *
	 * @param string $taxonomy  Taxonomy slug.
	 * @param int    $term_id   The term being created or updated. Pass 0 when creating.
	 * @param int    $parent_id The proposed parent term ID.
	 * @return true|string True when valid, an error message otherwise.
	 */
	protected function validate_term_parent( $taxonomy, $term_id, $parent_id ) {
		$term_id   = (int) $term_id;
		$parent_id = (int) $parent_id;

		if ( $term_id > 0 && $term_id === $parent_id ) {
			return __( 'A term cannot be its own parent.', 'sg-ai-studio' );
		}

		$current_parent_id = $parent_id;
		$visited           = array();
		$max_depth         = 100;
		$depth             = 0;

		while ( $current_parent_id > 0 && $depth < $max_depth ) {
			if ( in_array( $current_parent_id, $visited, true ) ) {
				return __( 'Circular parent relationship detected. A term cannot be a descendant of itself.', 'sg-ai-studio' );
			}

			if ( $term_id > 0 && $current_parent_id === $term_id ) {
				return __( 'Circular parent relationship detected. A term cannot be a descendant of itself.', 'sg-ai-studio' );
			}

			$visited[] = $current_parent_id;

			$parent_term = get_term( $current_parent_id, $taxonomy );

			if ( is_wp_error( $parent_term ) || ! $parent_term ) {
				return __( 'Invalid parent term ID for this taxonomy.', 'sg-ai-studio' );
			}

			$current_parent_id = (int) $parent_term->parent;
			$depth++;
		}

		return true;
	}

	/**
	 * Get the terms assigned to an object, grouped by taxonomy and named.
	 *
	 * Every REST-visible taxonomy registered on the post type is present as a
	 * key, so a taxonomy with nothing assigned reads as an empty array rather
	 * than as a missing key. Values are named terms, never bare IDs.
	 *
	 * Relies on the object term cache, so callers listing many objects should
	 * prime it once with `update_object_term_cache()` instead of paying a query
	 * per object.
	 *
	 * @param int         $post_id       Object ID.
	 * @param string      $post_type     Object post type.
	 * @param string|null $only_taxonomy Optional taxonomy slug to restrict the map to.
	 * @return array Map of taxonomy slug => array of prepared terms.
	 */
	protected function get_object_terms_map( $post_id, $post_type, $only_taxonomy = null ) {
		$map = array();

		foreach ( $this->get_rest_visible_taxonomies( $post_type ) as $taxonomy ) {
			if ( null !== $only_taxonomy && $taxonomy->name !== $only_taxonomy ) {
				continue;
			}

			$map[ $taxonomy->name ] = array();

			$terms = get_the_terms( $post_id, $taxonomy->name );

			if ( is_wp_error( $terms ) || empty( $terms ) ) {
				continue;
			}

			foreach ( $terms as $term ) {
				$map[ $taxonomy->name ][] = $this->prepare_term_for_response( $term );
			}
		}

		return $map;
	}
}
