<?php
/**
 * Taxonomies API class for discovering taxonomies via REST API
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;

/**
 * Handles REST API endpoints for taxonomy discovery.
 *
 * Read only. Taxonomies are registered in PHP at runtime, so there is no
 * meaningful way to create or delete one over REST and no such route exists.
 */
class Taxonomies extends Rest_Controller_Base {
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
		// Register endpoint for listing taxonomies.
		register_rest_route(
			$this->namespace,
			'/' . $this->base,
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_taxonomies' ),
					'permission_callback' => array( $this, 'list_permissions_check' ),
					'args'                => $this->get_taxonomies_args(),
					'description'         => 'Retrieves the taxonomies exposed over the REST API, including the rest_base and the terms endpoint for each. Taxonomies registered without show_in_rest are not listed and cannot be reached.',
				),
				'schema' => array( $this, 'get_taxonomy_schema' ),
			)
		);

		// Register endpoint for retrieving a single taxonomy.
		register_rest_route(
			$this->namespace,
			'/' . $this->base . '/(?P<taxonomy>[\w-]+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_single_taxonomy' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
					'args'                => array(
						'taxonomy' => array(
							'description' => 'Taxonomy slug or rest_base (either is accepted).',
							'type'        => 'string',
							'required'    => true,
						),
					),
					'description'         => 'Retrieves a specific taxonomy by slug or rest_base.',
				),
				'schema' => array( $this, 'get_taxonomy_schema' ),
			)
		);
	}

	/**
	 * Get arguments for retrieving taxonomies
	 *
	 * @return array
	 */
	protected function get_taxonomies_args() {
		return array(
			'type' => array(
				'description' => 'Limit the result set to the taxonomies registered on a specific post type.',
				'type'        => 'string',
				'required'    => false,
			),
		);
	}

	/**
	 * Get taxonomy schema
	 *
	 * @return array
	 */
	public function get_taxonomy_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'taxonomy',
			'type'       => 'object',
			'properties' => array(
				'slug'           => array(
					'description' => 'Taxonomy slug.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'name'           => array(
					'description' => 'Human readable taxonomy label.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'description'    => array(
					'description' => 'Taxonomy description.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'hierarchical'   => array(
					'description' => 'Whether terms in this taxonomy can have children.',
					'type'        => 'boolean',
					'readonly'    => true,
				),
				'rest_base'      => array(
					'description' => 'REST base of the taxonomy in the core wp/v2 namespace. Frequently differs from the slug.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'rest_namespace' => array(
					'description' => 'REST namespace of the taxonomy in core.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'types'          => array(
					'description' => 'Post types this taxonomy is registered on.',
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'readonly'    => true,
				),
				'terms_endpoint' => array(
					'description' => 'Route to list and create the terms of this taxonomy.',
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get the list of REST visible taxonomies
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_taxonomies( $request ) {
		$post_type = $request['type'];

		if ( ! empty( $post_type ) && ! get_post_type_object( $post_type ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post type.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$data = array();

		foreach ( $this->get_rest_visible_taxonomies( $post_type ) as $taxonomy ) {
			$data[] = $this->prepare_taxonomy_for_response( $taxonomy );
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $data,
			),
			200
		);
	}

	/**
	 * Get a single taxonomy by slug or rest_base
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success.
	 */
	public function get_single_taxonomy( $request ) {
		$key      = $request['taxonomy'];
		$taxonomy = $this->resolve_taxonomy( $key );

		if ( ! $taxonomy ) {
			return $this->taxonomy_not_visible_response( $key );
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $this->prepare_taxonomy_for_response( $taxonomy ),
			),
			200
		);
	}
}
