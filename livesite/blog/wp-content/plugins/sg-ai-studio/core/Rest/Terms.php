<?php
/**
 * Terms API class for managing the terms of any taxonomy via REST API
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;
use SG_AI_Studio\Activity_Log\Activity_Log_Helper;

/**
 * Handles REST API endpoints for term operations on any REST visible taxonomy.
 *
 * The taxonomy segment of every route accepts either the taxonomy slug or its
 * `rest_base`, because the two frequently differ and a caller that has only one
 * of them should not have to guess.
 *
 * Deletion is deliberately not supported. Terms have no trash, deletion is
 * immediate and permanent, and it silently unassigns the term from every post
 * and product that carried it with no revision trail. Both routes answer DELETE
 * with an explanatory 405 rather than a bare 404, so `rest_no_route` keeps
 * meaning exactly one thing: the taxonomy is not reachable.
 */
class Terms extends Rest_Controller_Base {
	use Taxonomy_Support;

	/**
	 * REST API base
	 *
	 * @var string
	 */
	private $base = 'taxonomies';

	/**
	 * Register REST API routes
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		// Register endpoint for listing and creating terms.
		register_rest_route(
			$this->namespace,
			'/' . $this->base . '/(?P<taxonomy>[\w-]+)/terms',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_terms_collection' ),
					'permission_callback' => array( $this, 'list_permissions_check' ),
					'args'                => $this->get_terms_args(),
					'description'         => 'Retrieves the terms of a taxonomy. An empty list means the taxonomy has no terms yet, which is not an error. Pass tree=true to get the parent nesting rebuilt, or post={id} to get only the terms assigned to one post.',
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'create_term' ),
					'permission_callback' => array( $this, 'create_permissions_check' ),
					'args'                => $this->get_create_term_args(),
					'description'         => 'Creates a term in a taxonomy. If the term already exists the existing term is returned with existing=true and a 200 status, so this call is safe to repeat.',
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( $this, 'reject_term_delete' ),
					'permission_callback' => array( $this, 'delete_permissions_check' ),
					'description'         => 'Not supported. Terms cannot be deleted over this API.',
				),
				'schema' => array( $this, 'get_term_schema' ),
			)
		);

		// Register endpoint for retrieving and updating a single term.
		register_rest_route(
			$this->namespace,
			'/' . $this->base . '/(?P<taxonomy>[\w-]+)/terms/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_single_term' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
					'args'                => array(
						'taxonomy' => array(
							'description' => 'Taxonomy slug or rest_base (either is accepted).',
							'type'        => 'string',
							'required'    => true,
						),
						'id'       => array(
							'description' => 'Unique identifier for the term.',
							'type'        => 'integer',
							'required'    => true,
						),
					),
					'description'         => 'Retrieves a specific term of a taxonomy by ID.',
				),
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_term' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => $this->get_update_term_args(),
					'description'         => 'Updates a term. Only the fields sent are changed; everything else is left as it is.',
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( $this, 'reject_term_delete' ),
					'permission_callback' => array( $this, 'delete_permissions_check' ),
					'description'         => 'Not supported. Terms cannot be deleted over this API.',
				),
				'schema' => array( $this, 'get_term_schema' ),
			)
		);
	}

	/**
	 * Get arguments for retrieving terms
	 *
	 * @return array
	 */
	protected function get_terms_args() {
		return array(
			'taxonomy'   => array(
				'description' => 'Taxonomy slug or rest_base (either is accepted).',
				'type'        => 'string',
				'required'    => true,
			),
			'page'       => array(
				'description'       => 'Current page of the collection.',
				'type'              => 'integer',
				'default'           => 1,
				'sanitize_callback' => 'absint',
				'minimum'           => 1,
				'required'          => false,
			),
			'per_page'   => array(
				'description'       => 'Maximum number of items to be returned in result set.',
				'type'              => 'integer',
				'default'           => 10,
				'minimum'           => 1,
				'maximum'           => 100,
				'sanitize_callback' => 'absint',
				'required'          => false,
			),
			'search'     => array(
				'description' => 'Limit results to those matching a string.',
				'type'        => 'string',
				'required'    => false,
			),
			'parent'     => array(
				'description' => 'Limit the result set to the direct children of a specific term. Use 0 for top level terms.',
				'type'        => 'integer',
				'required'    => false,
			),
			'post'       => array(
				'description' => 'Limit the result set to the terms of this taxonomy assigned to a specific post. Returns an empty list when nothing is assigned.',
				'type'        => 'integer',
				'required'    => false,
			),
			'tree'       => array(
				'description' => 'Return the terms nested by parent instead of as a flat list. Paging does not apply to a tree, so the whole taxonomy is returned.',
				'type'        => 'boolean',
				'default'     => false,
				'required'    => false,
			),
			'orderby'    => array(
				'description' => 'Sort collection by term attribute.',
				'type'        => 'string',
				'default'     => 'name',
				'enum'        => array( 'name', 'count', 'term_id', 'slug' ),
				'required'    => false,
			),
			'order'      => array(
				'description' => 'Order sort attribute ascending or descending.',
				'type'        => 'string',
				'default'     => 'asc',
				'enum'        => array( 'asc', 'desc' ),
				'required'    => false,
			),
			'hide_empty' => array(
				'description' => 'Whether to hide terms not assigned to any content.',
				'type'        => 'boolean',
				'default'     => false,
				'required'    => false,
			),
			'include'    => array(
				'description' => 'Limit result set to specific term IDs.',
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'required'    => false,
			),
			'exclude'    => array( // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
				'description' => 'Ensure result set excludes specific term IDs.',
				'type'        => 'array',
				'items'       => array(
					'type' => 'integer',
				),
				'required'    => false,
			),
		);
	}

	/**
	 * Get arguments for creating a term
	 *
	 * @return array
	 */
	protected function get_create_term_args() {
		return array(
			'taxonomy'    => array(
				'description' => 'Taxonomy slug or rest_base (either is accepted).',
				'type'        => 'string',
				'required'    => true,
			),
			'name'        => array(
				'description' => 'The name for the term.',
				'type'        => 'string',
				'required'    => true,
			),
			'slug'        => array(
				'description' => 'The slug for the term. Derived from the name when omitted.',
				'type'        => 'string',
				'required'    => false,
			),
			'description' => array(
				'description' => 'The description for the term.',
				'type'        => 'string',
				'required'    => false,
			),
			'parent'      => array(
				'description' => 'The parent term ID. Ignored on non hierarchical taxonomies.',
				'type'        => 'integer',
				'required'    => false,
			),
		);
	}

	/**
	 * Get arguments for updating a term
	 *
	 * @return array
	 */
	protected function get_update_term_args() {
		$args = $this->get_create_term_args();

		// Only the fields sent are changed, so nothing but the identifiers is required.
		$args['name']['required'] = false;

		$args['id'] = array(
			'description' => 'Unique identifier for the term.',
			'type'        => 'integer',
			'required'    => true,
		);

		return $args;
	}

	/**
	 * Get term schema
	 *
	 * @return array
	 */
	public function get_term_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'term',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => 'Unique identifier for the term.',
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'        => array(
					'description' => 'The name of the term.',
					'type'        => 'string',
				),
				'slug'        => array(
					'description' => 'The slug of the term.',
					'type'        => 'string',
				),
				'description' => array(
					'description' => 'The description of the term.',
					'type'        => 'string',
				),
				'parent'      => array(
					'description' => 'The parent term ID. 0 for a top level term.',
					'type'        => 'integer',
				),
				'count'       => array(
					'description' => 'Number of objects assigned to the term.',
					'type'        => 'integer',
					'readonly'    => true,
				),
				'taxonomy'    => array(
					'description' => 'The taxonomy the term belongs to.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'link'        => array(
					'description' => 'The URL to the term archive.',
					'type'        => 'string',
					'format'      => 'uri',
					'readonly'    => true,
				),
				'children'    => array(
					'description' => 'Child terms. Present only when tree=true was requested.',
					'type'        => 'array',
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get the terms of a taxonomy
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_terms_collection( $request ) {
		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		// Terms assigned to one post: a different query entirely, and never paginated.
		if ( null !== $request->get_param( 'post' ) ) {
			return $this->get_terms_for_post( $request, $taxonomy );
		}

		$page     = max( 1, (int) $request['page'] );
		$per_page = (int) $request['per_page'];
		$tree     = (bool) $request['tree'];

		$args = array(
			'taxonomy'   => $taxonomy->name,
			'orderby'    => $request['orderby'],
			'order'      => $request['order'],
			'hide_empty' => (bool) $request['hide_empty'],
		);

		if ( ! empty( $request['search'] ) ) {
			$args['search'] = $request['search'];
		}

		if ( null !== $request->get_param( 'parent' ) ) {
			$args['parent'] = (int) $request['parent'];
		}

		if ( ! empty( $request['include'] ) ) {
			$args['include'] = array_map( 'absint', (array) $request['include'] );
		}

		if ( ! empty( $request['exclude'] ) ) {
			// phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
			$args['exclude'] = array_map( 'absint', (array) $request['exclude'] );
		}

		$total = (int) get_terms( array_merge( $args, array( 'fields' => 'count' ) ) );

		// A tree cannot be paginated, so the whole (capped) taxonomy is loaded.
		$args['number'] = $tree ? $this->tree_term_limit : $per_page;
		$args['offset'] = $tree ? 0 : ( $page - 1 ) * $per_page;

		$terms = get_terms( $args );

		if ( is_wp_error( $terms ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $terms->get_error_message(),
				),
				400
			);
		}

		$data = array();

		foreach ( $terms as $term ) {
			$data[] = $this->prepare_term_for_response( $term );
		}

		$payload = array(
			'taxonomy'    => $taxonomy->name,
			'terms'       => $tree ? $this->build_term_tree( $data ) : $data,
			'total'       => $total,
			'page'        => $tree ? 1 : $page,
			'per_page'    => $tree ? $total : $per_page,
			'total_pages' => $tree ? 1 : (int) ceil( $total / max( 1, $per_page ) ),
		);

		if ( $tree && $total > $this->tree_term_limit ) {
			$payload['truncated']       = true;
			$payload['truncated_after'] = $this->tree_term_limit;
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $payload,
			),
			200
		);
	}

	/**
	 * Get the terms of a taxonomy assigned to a single post
	 *
	 * An object carries few enough terms that paging is pointless, so the whole
	 * set is returned. Nothing assigned is an empty list and a 200, never an error.
	 *
	 * @param WP_REST_Request $request  Full details about the request.
	 * @param \WP_Taxonomy    $taxonomy The resolved taxonomy.
	 * @return WP_REST_Response Response object on success.
	 */
	protected function get_terms_for_post( $request, $taxonomy ) {
		$post_id = (int) $request->get_param( 'post' );
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$payload = array(
			'taxonomy'    => $taxonomy->name,
			'post'        => $post_id,
			'terms'       => array(),
			'total'       => 0,
			'page'        => 1,
			'per_page'    => 0,
			'total_pages' => 1,
		);

		if ( ! is_object_in_taxonomy( $post->post_type, $taxonomy->name ) ) {
			/* translators: 1: taxonomy slug, 2: post type slug. */
			$payload['notice'] = sprintf( __( 'The taxonomy "%1$s" is not registered on the "%2$s" post type, so nothing can be assigned from it.', 'sg-ai-studio' ), $taxonomy->name, $post->post_type );

			return new WP_REST_Response(
				array(
					'success' => true,
					'data'    => $payload,
				),
				200
			);
		}

		$terms = wp_get_object_terms(
			$post_id,
			$taxonomy->name,
			array(
				'orderby' => $request['orderby'],
				'order'   => $request['order'],
			)
		);

		if ( is_wp_error( $terms ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $terms->get_error_message(),
				),
				400
			);
		}

		$data = array();

		foreach ( $terms as $term ) {
			$data[] = $this->prepare_term_for_response( $term );
		}

		$payload['terms']    = (bool) $request['tree'] ? $this->build_term_tree( $data ) : $data;
		$payload['total']    = count( $data );
		$payload['per_page'] = count( $data );

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $payload,
			),
			200
		);
	}

	/**
	 * Get a single term of a taxonomy
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_single_term( $request ) {
		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		$term = get_term( (int) $request['id'], $taxonomy->name );

		if ( is_wp_error( $term ) || ! $term ) {
			return $this->term_not_found_response( $taxonomy );
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $this->prepare_term_for_response( $term ),
			),
			200
		);
	}

	/**
	 * Create a term in a taxonomy
	 *
	 * A term that already exists is not a failure. Core returns `term_exists`
	 * with the existing term ID in the error data precisely so the caller can
	 * reuse it, so that case is answered with a 200 and the existing term rather
	 * than an error the caller has to reinterpret.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function create_term( $request ) {
		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		$name = sanitize_text_field( $request['name'] );

		if ( '' === trim( $name ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'The term name cannot be empty.', 'sg-ai-studio' ),
				),
				400
			);
		}

		$args = array();

		if ( isset( $request['slug'] ) ) {
			$args['slug'] = sanitize_title( $request['slug'] );
		}

		if ( isset( $request['description'] ) ) {
			$args['description'] = sanitize_textarea_field( $request['description'] );
		}

		// Parent is meaningless on a non hierarchical taxonomy, so it is dropped rather than rejected.
		if ( $taxonomy->hierarchical && ! empty( $request['parent'] ) ) {
			$parent_id  = absint( $request['parent'] );
			$validation = $this->validate_term_parent( $taxonomy->name, 0, $parent_id );

			if ( true !== $validation ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => $validation,
					),
					400
				);
			}

			$args['parent'] = $parent_id;
		}

		$result = wp_insert_term( $name, $taxonomy->name, $args );

		if ( is_wp_error( $result ) ) {
			return $this->handle_insert_term_error( $result, $taxonomy );
		}

		$term = get_term( $result['term_id'], $taxonomy->name );

		Activity_Log_Helper::add_log_entry(
			'Taxonomies',
			/* translators: 1: term name, 2: term ID, 3: taxonomy slug. */
			sprintf( __( 'Term Created: %1$s (ID: %2$d) in %3$s', 'sg-ai-studio' ), $term->name, $term->term_id, $taxonomy->name )
		);

		$this->purge_caches();

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $this->prepare_term_for_response( $term ),
			),
			201
		);
	}

	/**
	 * Update a term
	 *
	 * Only the fields present in the request are passed through, so unsent
	 * fields keep their current values.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function update_term( $request ) {
		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		$term_id = (int) $request['id'];
		$term    = get_term( $term_id, $taxonomy->name );

		if ( is_wp_error( $term ) || ! $term ) {
			return $this->term_not_found_response( $taxonomy );
		}

		$args = array();

		if ( isset( $request['name'] ) ) {
			$args['name'] = sanitize_text_field( $request['name'] );
		}

		if ( isset( $request['slug'] ) ) {
			$args['slug'] = sanitize_title( $request['slug'] );
		}

		if ( isset( $request['description'] ) ) {
			$args['description'] = sanitize_textarea_field( $request['description'] );
		}

		if ( $taxonomy->hierarchical && isset( $request['parent'] ) ) {
			$parent_id = absint( $request['parent'] );

			if ( $parent_id > 0 ) {
				$validation = $this->validate_term_parent( $taxonomy->name, $term_id, $parent_id );

				if ( true !== $validation ) {
					return new WP_REST_Response(
						array(
							'success' => false,
							'message' => $validation,
						),
						400
					);
				}
			}

			$args['parent'] = $parent_id;
		}

		if ( empty( $args ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No updatable fields were provided. Send at least one of name, slug, description or parent.', 'sg-ai-studio' ),
				),
				400
			);
		}

		$result = wp_update_term( $term_id, $taxonomy->name, $args );

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

		$term = get_term( $term_id, $taxonomy->name );

		Activity_Log_Helper::add_log_entry(
			'Taxonomies',
			/* translators: 1: term name, 2: term ID, 3: taxonomy slug. */
			sprintf( __( 'Term Updated: %1$s (ID: %2$d) in %3$s', 'sg-ai-studio' ), $term->name, $term_id, $taxonomy->name )
		);

		$this->purge_caches();

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $this->prepare_term_for_response( $term ),
			),
			200
		);
	}

	/**
	 * Reject a DELETE request on either term route
	 *
	 * @return WP_REST_Response
	 */
	public function reject_term_delete() {
		return new WP_REST_Response(
			array(
				'success' => false,
				'code'    => 'term_delete_not_supported',
				'message' => __( 'Terms cannot be deleted over this API. There is no trash for terms: deletion is immediate and permanent, it silently unassigns the term from every post and product that carried it, and it leaves no revision trail. Delete the term from the Admin menus if that is genuinely intended.', 'sg-ai-studio' ),
			),
			405
		);
	}

	/**
	 * Turn a wp_insert_term error into a response
	 *
	 * @param \WP_Error    $error    The error returned by wp_insert_term().
	 * @param \WP_Taxonomy $taxonomy The taxonomy the term was being created in.
	 * @return WP_REST_Response
	 */
	protected function handle_insert_term_error( $error, $taxonomy ) {
		if ( 'term_exists' !== $error->get_error_code() ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'code'    => $error->get_error_code(),
					'message' => $error->get_error_message(),
				),
				400
			);
		}

		$error_data  = $error->get_error_data();
		$existing_id = is_array( $error_data ) && isset( $error_data['term_id'] ) ? (int) $error_data['term_id'] : (int) $error_data;
		$existing    = $existing_id > 0 ? get_term( $existing_id, $taxonomy->name ) : null;

		if ( ! $existing || is_wp_error( $existing ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'code'    => 'term_exists',
					'message' => $error->get_error_message(),
				),
				400
			);
		}

		return new WP_REST_Response(
			array(
				'success'  => true,
				'existing' => true,
				'message'  => __( 'The term already exists in this taxonomy. The existing term is returned so it can be used as is.', 'sg-ai-studio' ),
				'data'     => $this->prepare_term_for_response( $existing ),
			),
			200
		);
	}

	/**
	 * Build the 404 response for a term that is not in the given taxonomy
	 *
	 * @param \WP_Taxonomy $taxonomy The taxonomy that was searched.
	 * @return WP_REST_Response
	 */
	protected function term_not_found_response( $taxonomy ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'code'    => 'term_not_found',
				'message' => sprintf(
					/* translators: %s is the taxonomy slug. */
					__( 'No such term in the "%s" taxonomy. The term may belong to a different taxonomy.', 'sg-ai-studio' ),
					$taxonomy->name
				),
			),
			404
		);
	}
}
