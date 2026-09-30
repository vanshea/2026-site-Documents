<?php
/**
 * Shared term assignment endpoints for post-like REST controllers.
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;
use SG_AI_Studio\Activity_Log\Activity_Log_Helper;

/**
 * Provides read and assign endpoints for the terms carried by a single object.
 *
 * Consumed by the Posts, Pages and Products controllers so the handlers live in
 * one place, mirroring the Revisions trait.
 *
 * Assignment defaults to `add`, which unions the given terms with the ones
 * already on the object. Core's own behaviour is a full replace, and a caller
 * that forgets to read the current set first silently unassigns everything it
 * did not send. Defaulting to a union makes "a post with two terms that receives
 * one more ends up with three" true by construction; `replace` is still
 * available for callers that genuinely mean it.
 */
trait Object_Terms {
	use Taxonomy_Support;

	/**
	 * Optional post type the object term endpoints are constrained to.
	 *
	 * When set (e.g. 'page'), the object must be of this type or the request 404s.
	 * When null, any post type is accepted.
	 *
	 * @var string|null
	 */
	protected $object_terms_post_type = null;

	/**
	 * Register the object term sub-routes for a controller.
	 *
	 * @param string      $base      REST base of the parent resource (e.g. 'posts').
	 * @param string|null $post_type Optional post type constraint for the object.
	 * @return void
	 */
	public function register_object_terms_routes( $base, $post_type = null ) {
		$this->object_terms_post_type = $post_type;

		register_rest_route(
			$this->namespace,
			'/' . $base . '/(?P<id>[\d]+)/terms',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_object_terms' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => 'Unique identifier for the object.',
							'type'        => 'integer',
							'required'    => true,
						),
						'taxonomy' => array(
							'description' => 'Limit the result to one taxonomy, by slug or rest_base. All taxonomies on the object are returned when omitted.',
							'type'        => 'string',
							'required'    => false,
						),
					),
					'description'         => 'Retrieves the terms assigned to an object, grouped by taxonomy and returned as named terms rather than bare IDs. A taxonomy with nothing assigned is present as an empty array, which is not an error.',
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'set_object_terms' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => $this->get_set_object_terms_args(),
					'description'         => 'Assigns terms to an object. mode=add (the default) keeps the terms already assigned and adds the given ones; mode=replace discards every term not sent; mode=remove unassigns the given terms. The response carries the resulting term set plus what was added and removed.',
				),
			)
		);
	}

	/**
	 * The `embed_terms` argument definition, shared by every content read route.
	 *
	 * @return array
	 */
	protected function get_embed_terms_arg() {
		return array(
			'description' => 'Include a terms object with the assigned terms of every taxonomy on the object, as named terms rather than bare IDs.',
			'type'        => 'boolean',
			'default'     => false,
			'required'    => false,
		);
	}

	/**
	 * Get arguments for assigning terms to an object
	 *
	 * @return array
	 */
	protected function get_set_object_terms_args() {
		return array(
			'id'       => array(
				'description' => 'Unique identifier for the object.',
				'type'        => 'integer',
				'required'    => true,
			),
			'taxonomy' => array(
				'description' => 'Taxonomy slug or rest_base (either is accepted).',
				'type'        => 'string',
				'required'    => true,
			),
			'terms'    => array(
				'description' => 'Term IDs to assign. Use the terms endpoint of the taxonomy to look up or create the IDs first.',
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'required'    => true,
			),
			'mode'     => array(
				'description' => 'add keeps the existing terms and adds these, replace discards every term not sent, remove unassigns these. Defaults to add.',
				'type'        => 'string',
				'enum'        => array( 'add', 'replace', 'remove' ),
				'default'     => 'add',
				'required'    => false,
			),
		);
	}

	/**
	 * Get the terms assigned to an object
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_object_terms( $request ) {
		$post = $this->get_object_for_terms( (int) $request['id'] );

		if ( $post instanceof WP_REST_Response ) {
			return $post;
		}

		$only_taxonomy = null;

		if ( ! empty( $request['taxonomy'] ) ) {
			$taxonomy = $this->resolve_taxonomy( $request['taxonomy'] );

			if ( ! $taxonomy ) {
				return $this->taxonomy_not_visible_response( $request['taxonomy'] );
			}

			$only_taxonomy = $taxonomy->name;
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'id'    => $post->ID,
					'type'  => $post->post_type,
					'terms' => $this->get_object_terms_map( $post->ID, $post->post_type, $only_taxonomy ),
				),
			),
			200
		);
	}

	/**
	 * Assign terms to an object
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function set_object_terms( $request ) {
		$post = $this->get_object_for_terms( (int) $request['id'] );

		if ( $post instanceof WP_REST_Response ) {
			return $post;
		}

		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		if ( ! is_object_in_taxonomy( $post->post_type, $taxonomy->name ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'code'    => 'taxonomy_not_on_post_type',
					'message' => sprintf(
						/* translators: 1: taxonomy slug, 2: post type slug. */
						__( 'The taxonomy "%1$s" is not registered on the "%2$s" post type, so its terms cannot be assigned here.', 'sg-ai-studio' ),
						$taxonomy->name,
						$post->post_type
					),
				),
				400
			);
		}

		$term_ids = array_values( array_unique( array_map( 'absint', (array) $request['terms'] ) ) );
		$unknown  = array();

		foreach ( $term_ids as $term_id ) {
			$term = get_term( $term_id, $taxonomy->name );

			if ( is_wp_error( $term ) || ! $term ) {
				$unknown[] = $term_id;
			}
		}

		if ( ! empty( $unknown ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'code'    => 'invalid_term_ids',
					'message' => sprintf(
						/* translators: 1: comma separated term IDs, 2: taxonomy slug. */
						__( 'These term IDs do not exist in the "%2$s" taxonomy: %1$s.', 'sg-ai-studio' ),
						implode( ', ', $unknown ),
						$taxonomy->name
					),
				),
				400
			);
		}

		$mode   = ! empty( $request['mode'] ) ? $request['mode'] : 'add';
		$before = $this->get_assigned_term_ids( $post->ID, $taxonomy->name );

		if ( 'remove' === $mode ) {
			$result = wp_remove_object_terms( $post->ID, $term_ids, $taxonomy->name );
		} else {
			// append = true for add, false for replace.
			$result = wp_set_object_terms( $post->ID, $term_ids, $taxonomy->name, 'add' === $mode );
		}

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'code'    => $result->get_error_code(),
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		clean_object_term_cache( $post->ID, $post->post_type );

		$after = $this->get_assigned_term_ids( $post->ID, $taxonomy->name );

		$added   = array_values( array_diff( $after, $before ) );
		$removed = array_values( array_diff( $before, $after ) );

		Activity_Log_Helper::add_log_entry(
			'Taxonomies',
			sprintf(
				/* translators: 1: taxonomy slug, 2: object ID, 3: assignment mode, 4: number of terms added, 5: number of terms removed. */
				__( 'Terms Assigned: %1$s on object %2$d (mode: %3$s, +%4$d, -%5$d)', 'sg-ai-studio' ),
				$taxonomy->name,
				$post->ID,
				$mode,
				count( $added ),
				count( $removed )
			)
		);

		$this->purge_caches();

		$terms_map = $this->get_object_terms_map( $post->ID, $post->post_type, $taxonomy->name );

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'id'       => $post->ID,
					'type'     => $post->post_type,
					'taxonomy' => $taxonomy->name,
					'mode'     => $mode,
					'terms'    => isset( $terms_map[ $taxonomy->name ] ) ? $terms_map[ $taxonomy->name ] : array(),
					'added'    => $this->name_term_ids( $added, $taxonomy->name ),
					'removed'  => $this->name_term_ids( $removed, $taxonomy->name ),
				),
			),
			200
		);
	}

	/**
	 * Resolve and validate the object the term endpoints were called on
	 *
	 * @param int $post_id Object ID.
	 * @return \WP_Post|WP_REST_Response The post, or an error response.
	 */
	protected function get_object_for_terms( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post || ( null !== $this->object_terms_post_type && $this->object_terms_post_type !== $post->post_type ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid object ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		return $post;
	}

	/**
	 * Get the IDs of the terms of one taxonomy currently assigned to an object
	 *
	 * @param int    $post_id  Object ID.
	 * @param string $taxonomy Taxonomy slug.
	 * @return int[] Term IDs.
	 */
	protected function get_assigned_term_ids( $post_id, $taxonomy ) {
		$ids = wp_get_object_terms( $post_id, $taxonomy, array( 'fields' => 'ids' ) );

		if ( is_wp_error( $ids ) ) {
			return array();
		}

		return array_map( 'intval', $ids );
	}

	/**
	 * Turn a list of term IDs into id and name pairs
	 *
	 * Term IDs are never reported on their own, so the diff carried by the
	 * assignment response is named too.
	 *
	 * @param int[]  $term_ids Term IDs.
	 * @param string $taxonomy Taxonomy slug.
	 * @return array List of arrays with `id` and `name`.
	 */
	protected function name_term_ids( $term_ids, $taxonomy ) {
		$named = array();

		foreach ( $term_ids as $term_id ) {
			$term = get_term( $term_id, $taxonomy );

			if ( is_wp_error( $term ) || ! $term ) {
				continue;
			}

			$named[] = array(
				'id'   => (int) $term->term_id,
				'name' => $term->name,
			);
		}

		return $named;
	}
}
