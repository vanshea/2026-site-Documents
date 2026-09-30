<?php
/**
 * Entity API class for fetching individual entities with parsed blocks
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;

/**
 * Handles REST API endpoint for entity retrieval with cleaned block structure.
 * Supports pages, posts, reusable blocks (wp_block), templates, and template parts.
 */
class Entity extends Rest_Controller_Base {
	/**
	 * REST API base
	 *
	 * @var string
	 */
	private $base = 'entity';

	/**
	 * Register REST API routes
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		// GET endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->base,
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_entity' ),
				'permission_callback' => array( $this, 'read_permissions_check' ),
				'args'                => $this->get_entity_args(),
				'description'         => 'Retrieves a single entity with cleaned, parsed block structure.',
			)
		);

		// PATCH endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->base,
			array(
				'methods'             => 'PATCH',
				'callback'            => array( $this, 'patch_entity' ),
				'permission_callback' => array( $this, 'update_permissions_check' ),
				'args'                => $this->get_patch_entity_args(),
				'description'         => 'Apply block-scoped operations to an entity.',
			)
		);
	}

	/**
	 * Handle PATCH request (delegates to Entity_Patch)
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function patch_entity( $request ) {
		$patch_handler = new Entity_Patch( $this );
		return $patch_handler->patch_entity( $request );
	}

	/**
	 * Check permissions for update operations
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error True if allowed, WP_Error otherwise.
	 */
	public function update_permissions_check( $request ) {
		return $this->check_jwt_authorization( $request );
	}

	/**
	 * Get arguments for PATCH request
	 *
	 * @return array Arguments schema.
	 */
	protected function get_patch_entity_args() {
		return array(
			'type'       => array(
				'description' => 'Entity type.',
				'type'        => 'string',
				'enum'        => array( 'page', 'post', 'template', 'template_part', 'wp_block' ),
				'required'    => true,
			),
			'id'         => array(
				'description' => 'Entity ID (numeric for posts, slug for templates).',
				'type'        => 'string',
				'required'    => true,
			),
			'if_match'   => array(
				'description' => 'ETag from GET request for concurrency control.',
				'type'        => 'string',
				'required'    => true,
			),
			'operations' => array(
				'description' => 'Array of operations to apply: set_attr, replace_block, insert_before, insert_after, insert_child, delete, move.',
				'type'        => 'array',
				'required'    => true,
				'items'       => array(
					'type' => 'object',
				),
			),
		);
	}

	/**
	 * Get arguments for entity endpoint
	 *
	 * @return array
	 */
	protected function get_entity_args() {
		return array(
			'type' => array(
				'description' => 'Entity type to fetch.',
				'type'        => 'string',
				'enum'        => array( 'page', 'post', 'wp_block', 'template', 'template_part' ),
				'required'    => true,
			),
			'id'   => array(
				'description' => 'Entity ID (post ID for posts/pages/wp_block, template slug for templates).',
				'type'        => 'string',
				'required'    => true,
			),
		);
	}

	/**
	 * Get entity with cleaned block structure
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object with entity data.
	 */
	public function get_entity( $request ) {
		$type = $request->get_param( 'type' );
		$id   = $request->get_param( 'id' );

		// Validate type.
		if ( ! in_array( $type, array( 'page', 'post', 'wp_block', 'template', 'template_part' ), true ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid entity type.', 'sg-ai-studio' ),
				),
				400
			);
		}

		// Block theme gating for templates.
		if ( in_array( $type, array( 'template', 'template_part' ), true ) ) {
			if ( ! function_exists( 'wp_is_block_theme' ) || ! wp_is_block_theme() ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => __( 'Templates are only available for block themes.', 'sg-ai-studio' ),
					),
					400
				);
			}
		}

		// Fetch entity based on type.
		$entity_data = $this->fetch_entity_by_type( $type, $id );

		if ( is_wp_error( $entity_data ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $entity_data->get_error_message(),
				),
				$entity_data->get_error_code() === 'not_found' ? 404 : 400
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $entity_data,
			),
			200
		);
	}

	/**
	 * Fetch entity data by type
	 *
	 * @param string $type Entity type.
	 * @param string $id   Entity ID.
	 * @return array|\WP_Error Entity data or error.
	 */
	private function fetch_entity_by_type( $type, $id ) {
		switch ( $type ) {
			case 'page':
			case 'post':
			case 'wp_block':
				return $this->fetch_post_entity( $type, $id );

			case 'template':
				return $this->fetch_template_entity( $id, 'wp_template' );

			case 'template_part':
				return $this->fetch_template_entity( $id, 'wp_template_part' );

			default:
				return new \WP_Error( 'invalid_type', __( 'Invalid entity type.', 'sg-ai-studio' ) );
		}
	}

	/**
	 * Fetch post-based entity (page, post, wp_block)
	 *
	 * @param string $type Post type.
	 * @param int    $id   Post ID.
	 * @return array|\WP_Error Entity data or error.
	 */
	private function fetch_post_entity( $type, $id ) {
		$post = get_post( (int) $id );

		if ( ! $post || $post->post_type !== $type ) {
			return new \WP_Error( 'not_found', __( 'Entity not found.', 'sg-ai-studio' ) );
		}

		$content  = $post->post_content;
		$modified = mysql_to_rfc3339( $post->post_modified );
		$etag     = $this->generate_etag( $content, $post->post_modified );

		// Parse and clean blocks.
		$parsed_blocks = parse_blocks( $content );
		$cleaned_blocks = $this->clean_blocks( $parsed_blocks );

		return array(
			'type'     => $type,
			'id'       => $post->ID,
			'title'    => $post->post_title,
			'slug'     => $post->post_name,
			'status'   => $post->post_status,
			'modified' => $modified,
			'etag'     => $etag,
			'blocks'   => $cleaned_blocks,
		);
	}

	/**
	 * Fetch template entity (wp_template or wp_template_part)
	 *
	 * @param string $slug Template slug.
	 * @param string $type Template type (wp_template or wp_template_part).
	 * @return array|\WP_Error Entity data or error.
	 */
	private function fetch_template_entity( $slug, $type ) {
		if ( ! function_exists( 'get_block_template' ) ) {
			return new \WP_Error( 'not_supported', __( 'Block templates are not supported.', 'sg-ai-studio' ) );
		}

		$template = get_block_template( $slug, $type );

		if ( ! $template ) {
			return new \WP_Error( 'not_found', __( 'Template not found.', 'sg-ai-studio' ) );
		}

		$content  = $template->content;
		$modified = $this->get_template_modified_date( $template );
		$etag     = $this->generate_etag( $content, $modified );

		// Parse and clean blocks.
		$parsed_blocks = parse_blocks( $content );
		$cleaned_blocks = $this->clean_blocks( $parsed_blocks );

		return array(
			'type'     => $type === 'wp_template' ? 'template' : 'template_part',
			'id'       => $template->id,
			'title'    => $template->title,
			'slug'     => $template->slug,
			'status'   => isset( $template->status ) ? $template->status : 'publish',
			'modified' => $modified,
			'etag'     => $etag,
			'blocks'   => $cleaned_blocks,
		);
	}

	/**
	 * Get modified date for template
	 *
	 * @param object $template Template object.
	 * @return string|null Modified date in RFC3339 format or null.
	 */
	private function get_template_modified_date( $template ) {
		// Check if template is customized (stored in database).
		if ( 'custom' === $template->source ) {
			$template_post = get_page_by_path( $template->slug, OBJECT, $template->type );
			if ( $template_post ) {
				return mysql_to_rfc3339( $template_post->post_modified );
			}
		}

		// Fallback: no modified date for theme-based templates.
		return null;
	}

	/**
	 * Generate ETag hash for entity
	 *
	 * Public so Entity_Patch can hash with the exact same rules; the GET and
	 * PATCH ETags have to be byte-identical or concurrency control breaks.
	 *
	 * @param string $content  Entity content.
	 * @param string $modified Modified date.
	 * @return string MD5 hash.
	 */
	public function generate_etag( $content, $modified ) {
		$hash_input = $content . ( $modified ?? '' );
		return md5( $hash_input );
	}

	/**
	 * Recursively clean blocks, removing innerHTML and innerContent
	 *
	 * Public so Entity_Patch can return the same block shape from PATCH as
	 * this endpoint returns from GET.
	 *
	 * @param array $blocks Parsed blocks array.
	 * @return array Cleaned blocks array.
	 */
	public function clean_blocks( $blocks ) {
		$cleaned = array();

		foreach ( $blocks as $block ) {
			// Skip null-name whitespace blocks.
			if ( null === $block['blockName'] || '' === $block['blockName'] ) {
				continue;
			}

			$cleaned_block = array(
				'blockName'   => $block['blockName'],
				'attrs'       => isset( $block['attrs'] ) ? $block['attrs'] : array(),
				'innerBlocks' => array(),
			);

			// Recursively clean nested blocks.
			if ( ! empty( $block['innerBlocks'] ) ) {
				$cleaned_block['innerBlocks'] = $this->clean_blocks( $block['innerBlocks'] );
			}

			$cleaned[] = $cleaned_block;
		}

		return $cleaned;
	}
}
