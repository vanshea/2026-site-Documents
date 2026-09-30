<?php
/**
 * Entity PATCH operations handler
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;
use WP_Error;
use SG_AI_Studio\Activity_Log\Activity_Log_Helper;

/**
 * Handles PATCH operations for entity endpoint.
 * Provides block-scoped operations to avoid payload bloat and markup corruption.
 *
 * Which op serves which edit case:
 * - Modify an existing block, attribute-only change: set_attr (preferred).
 * - Modify an existing block, larger content or structural change: replace_block.
 * - Add a new block or subtree: insert_after, insert_before, insert_child.
 * - Remove a block: delete. Reorder a block: move.
 */
class Entity_Patch {
	/**
	 * Parent Entity instance
	 *
	 * @var Entity
	 */
	private $entity;

	/**
	 * Non-fatal notices collected while applying operations
	 *
	 * @var array
	 */
	private $notices = array();

	/**
	 * Constructor
	 *
	 * @param Entity $entity Parent entity instance.
	 */
	public function __construct( $entity ) {
		$this->entity = $entity;
	}

	/**
	 * Handle PATCH request
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function patch_entity( $request ) {
		$type       = $request->get_param( 'type' );
		$id         = $request->get_param( 'id' );
		$if_match   = $request->get_param( 'if_match' );
		$operations = $request->get_param( 'operations' );

		// 1. Fetch current entity.
		$entity = $this->fetch_entity_data( $type, $id );

		if ( is_wp_error( $entity ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $entity->get_error_message(),
				),
				$this->error_status( $entity )
			);
		}

		// Extract content.
		$content  = $entity['content'];
		$modified = $entity['modified'];

		// 2. Validate ETag (concurrency control).
		$etag_check = $this->validate_etag( $if_match, $content, $modified );
		if ( is_wp_error( $etag_check ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $etag_check->get_error_message(),
				),
				409
			);
		}

		// 3. Check the entity exists.
		$exists_check = $this->validate_entity_exists( $type, $id );
		if ( is_wp_error( $exists_check ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $exists_check->get_error_message(),
				),
				$this->error_status( $exists_check )
			);
		}

		// 4. Parse blocks.
		$blocks = parse_blocks( $content );

		// 5. Apply operations atomically. Nothing is persisted if any operation
		// fails; the failure is returned structured so the caller can correct it.
		foreach ( $operations as $i => $operation ) {
			if ( ! isset( $operation['op'] ) ) {
				return $this->operation_error_response(
					$i,
					$operation,
					new WP_Error( 'missing_op', __( 'Operation is missing the "op" field.', 'sg-ai-studio' ) )
				);
			}

			$result = $this->apply_operation( $blocks, $operation );

			if ( is_wp_error( $result ) ) {
				return $this->operation_error_response( $i, $operation, $result );
			}
		}

		// 6. Serialize and persist.
		$new_content = '';
		foreach ( $blocks as $block ) {
			$new_content .= serialize_block( $block );
		}
		$new_content = trim( $new_content );

		$update_result = $this->persist_entity( $type, $id, $new_content );

		if ( is_wp_error( $update_result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $update_result->get_error_message(),
				),
				500
			);
		}

		// 7. Activity logging.
		Activity_Log_Helper::add_log_entry(
			'Entity',
			sprintf(
				__( 'Entity patched: %s %s (Operations: %d)', 'sg-ai-studio' ),
				$type,
				$id,
				count( $operations )
			)
		);

		// 8. Cache invalidation.
		$this->clear_caches();

		// 9. Fetch updated entity.
		$updated = $this->fetch_entity_data( $type, $id );

		// 10. Return response.
		$data = array(
			'type'     => $type,
			'id'       => $id,
			'title'    => $updated['title'],
			'slug'     => $updated['slug'],
			'status'   => $updated['status'],
			'modified' => $updated['modified'],
			'etag'     => $this->entity->generate_etag( $new_content, $updated['modified'] ),
			'blocks'   => $this->entity->clean_blocks( $blocks ),
		);

		if ( ! empty( $this->notices ) ) {
			$data['notices'] = $this->notices;
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
	 * Build a structured error response for a failed operation
	 *
	 * @param int      $index     Index of the operation in the request.
	 * @param array    $operation Operation that failed.
	 * @param WP_Error $error     Failure.
	 * @return WP_REST_Response Response object.
	 */
	private function operation_error_response( $index, $operation, $error ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => $error->get_error_message(),
				'errors'  => array(
					array(
						'index'   => $index,
						'op'      => isset( $operation['op'] ) ? $operation['op'] : null,
						'path'    => isset( $operation['path'] ) ? $operation['path'] : null,
						'code'    => $error->get_error_code(),
						'message' => $error->get_error_message(),
					),
				),
			),
			$this->error_status( $error )
		);
	}

	/**
	 * Fetch entity data
	 *
	 * @param string $type Entity type.
	 * @param string $id   Entity ID.
	 * @return array|WP_Error Entity data or error.
	 */
	private function fetch_entity_data( $type, $id ) {
		if ( in_array( $type, array( 'page', 'post', 'wp_block' ), true ) ) {
			$post = get_post( (int) $id );

			if ( ! $post || $post->post_type !== $type ) {
				return new WP_Error( 'not_found', __( 'Entity not found.', 'sg-ai-studio' ) );
			}

			return array(
				'content'  => $post->post_content,
				'modified' => $post->post_modified,
				'title'    => $post->post_title,
				'slug'     => $post->post_name,
				'status'   => $post->post_status,
			);
		} elseif ( in_array( $type, array( 'template', 'template_part' ), true ) ) {
			if ( ! function_exists( 'get_block_template' ) ) {
				return new WP_Error( 'not_supported', __( 'Block templates not supported.', 'sg-ai-studio' ) );
			}

			$template_type = $type === 'template' ? 'wp_template' : 'wp_template_part';
			$template      = get_block_template( $id, $template_type );

			if ( ! $template ) {
				return new WP_Error( 'not_found', __( 'Template not found.', 'sg-ai-studio' ) );
			}

			$modified = null;
			if ( 'custom' === $template->source ) {
				$template_post = get_page_by_path( $id, OBJECT, $template_type );
				if ( $template_post ) {
					$modified = $template_post->post_modified;
				}
			}

			return array(
				'content'  => $template->content,
				'modified' => $modified,
				'title'    => $template->title,
				'slug'     => $template->slug,
				'status'   => isset( $template->status ) ? $template->status : 'publish',
			);
		}

		return new WP_Error( 'invalid_type', __( 'Invalid entity type.', 'sg-ai-studio' ) );
	}

	/**
	 * Validate ETag for concurrency control
	 *
	 * @param string $if_match ETag from request.
	 * @param string $content  Current entity content.
	 * @param string $modified Current modified date.
	 * @return bool|WP_Error   True if match, WP_Error if mismatch.
	 */
	private function validate_etag( $if_match, $content, $modified ) {
		$current_etag = $this->entity->generate_etag( $content, $modified );

		if ( $if_match !== $current_etag ) {
			return new WP_Error(
				'precondition_failed',
				__( 'Entity has been modified since you last fetched it. Please refresh and retry.', 'sg-ai-studio' ),
				array( 'status' => 409 )
			);
		}

		return true;
	}

	/**
	 * Map a WP_Error to an HTTP status code
	 *
	 * Only a missing entity is a 404; a bad type or an unsupported install is a
	 * malformed request.
	 *
	 * @param WP_Error $error Error to map.
	 * @return int HTTP status code.
	 */
	private function error_status( $error ) {
		$data = $error->get_error_data();

		if ( is_array( $data ) && isset( $data['status'] ) ) {
			return (int) $data['status'];
		}

		return 'not_found' === $error->get_error_code() ? 404 : 400;
	}

	/**
	 * Validate the entity exists
	 *
	 * No current_user_can() checks here: the request is authorized upstream by
	 * the REST permission callback (JWT), so there is no logged-in user context
	 * to test capabilities against.
	 *
	 * @param string $type Entity type.
	 * @param mixed  $id   Entity ID.
	 * @return bool|WP_Error True if the entity exists, WP_Error if not.
	 */
	private function validate_entity_exists( $type, $id ) {
		// List of supported types.
		$supported_types = array(
			'page',
			'post',
			'wp_block',
		);

		if ( in_array( $type, $supported_types, true ) ) {
			$post = get_post( (int) $id );

			if ( ! $post ) {
				return new WP_Error( 'not_found', __( 'Entity not found.', 'sg-ai-studio' ) );
			}
		}

		return true;
	}

	/**
	 * Apply single operation
	 *
	 * @param array $blocks    Block tree (passed by reference).
	 * @param array $operation Operation to apply.
	 * @return bool|WP_Error   True on success, WP_Error on failure.
	 */
	private function apply_operation( &$blocks, $operation ) {
		switch ( $operation['op'] ) {
			case 'set_attr':
				return $this->op_set_attr( $blocks, $operation );
			case 'replace_block':
				return $this->op_replace_block( $blocks, $operation );
			case 'insert_before':
				return $this->op_insert_before( $blocks, $operation );
			case 'insert_after':
				return $this->op_insert_after( $blocks, $operation );
			case 'insert_child':
				return $this->op_insert_child( $blocks, $operation );
			case 'delete':
				return $this->op_delete( $blocks, $operation );
			case 'move':
				return $this->op_move( $blocks, $operation );
			default:
				return new WP_Error(
					'invalid_operation',
					sprintf( __( 'Unknown operation: %s', 'sg-ai-studio' ), $operation['op'] )
				);
		}
	}

	/**
	 * Resolve block path to array reference
	 *
	 * @param array  $blocks Block tree (passed by reference).
	 * @param string $path   Dot notation path.
	 * @return array|WP_Error Array with block, parent, index or error.
	 */
	private function resolve_path( &$blocks, $path ) {
		$parts = explode( '.', $path );

		if ( $parts[0] !== 'blocks' ) {
			return new WP_Error( 'invalid_path', __( 'Path must start with "blocks".', 'sg-ai-studio' ) );
		}

		array_shift( $parts );

		$current    = &$blocks;
		$parent     = null;
		$last_index = null;

		foreach ( $parts as $part ) {
			if ( is_numeric( $part ) ) {
				$index = (int) $part;

				if ( ! isset( $current[ $index ] ) ) {
					return new WP_Error(
						'path_out_of_bounds',
						sprintf( __( 'Index %d does not exist in path %s.', 'sg-ai-studio' ), $index, $path )
					);
				}

				$parent     = &$current;
				$last_index = $index;
				$current    = &$current[ $index ];
			} elseif ( $part === 'innerBlocks' ) {
				if ( ! isset( $current['innerBlocks'] ) ) {
					return new WP_Error( 'invalid_path', __( 'Block has no innerBlocks.', 'sg-ai-studio' ) );
				}

				$current = &$current['innerBlocks'];
			} else {
				return new WP_Error(
					'invalid_path',
					sprintf( __( 'Invalid path segment: %s', 'sg-ai-studio' ), $part )
				);
			}
		}

		return array(
			'block'  => &$current,
			'parent' => &$parent,
			'index'  => $last_index,
		);
	}

	/**
	 * Operation: set_attr
	 *
	 * Attribute-only change to an existing block. Generated classes live in the
	 * saved markup, not the delimiter JSON, so the validator's regenerated
	 * markup is consumed from the optional `markup` field when present.
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_set_attr( &$blocks, $operation ) {
		if ( ! isset( $operation['path'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'set_attr requires a path.', 'sg-ai-studio' ) );
		}

		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		$block = &$resolved['block'];

		if ( ! isset( $operation['attrs'] ) || ! is_array( $operation['attrs'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'set_attr requires attrs object.', 'sg-ai-studio' ) );
		}

		if ( ! isset( $block['attrs'] ) ) {
			$block['attrs'] = array();
		}

		$block['attrs'] = array_merge( $block['attrs'], $operation['attrs'] );

		if ( isset( $operation['markup'] ) && '' !== trim( (string) $operation['markup'] ) ) {
			$regenerated = $this->parse_single_block( $operation['markup'] );

			if ( is_wp_error( $regenerated ) ) {
				return $regenerated;
			}

			if ( $regenerated['blockName'] !== $block['blockName'] ) {
				return new WP_Error(
					'markup_block_mismatch',
					sprintf(
						/* translators: 1: block name in the supplied markup, 2: block name at the target path. */
						__( 'Regenerated markup is %1$s but the block at this path is %2$s.', 'sg-ai-studio' ),
						$regenerated['blockName'],
						$block['blockName']
					)
				);
			}

			// Attributes stay authoritative; the markup supplies regenerated classes.
			$block['innerHTML']    = $regenerated['innerHTML'];
			$block['innerContent'] = $regenerated['innerContent'];
			$block['innerBlocks']  = $regenerated['innerBlocks'];
		} else {
			$this->notices[] = array(
				'code'    => 'markup_not_regenerated',
				'path'    => $operation['path'],
				'message' => __( 'Attributes updated without regenerated markup; generated classes may be stale.', 'sg-ai-studio' ),
			);
		}

		return true;
	}

	/**
	 * Parse a markup string that must contain exactly one block
	 *
	 * @param string $markup Block markup.
	 * @return array|WP_Error Parsed block or error.
	 */
	private function parse_single_block( $markup ) {
		$parsed = array_values(
			array_filter(
				parse_blocks( $markup ),
				static function ( $block ) {
					return ! empty( $block['blockName'] );
				}
			)
		);

		if ( 1 !== count( $parsed ) ) {
			return new WP_Error(
				'invalid_markup',
				sprintf(
					/* translators: %d: number of blocks found in the supplied markup. */
					__( 'Regenerated markup must contain exactly one block, found %d.', 'sg-ai-studio' ),
					count( $parsed )
				)
			);
		}

		return $parsed[0];
	}

	/**
	 * Operation: replace_block
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_replace_block( &$blocks, $operation ) {
		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		if ( ! isset( $operation['block'] ) || ! is_array( $operation['block'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'replace_block requires block object.', 'sg-ai-studio' ) );
		}

		$parent = &$resolved['parent'];
		$index  = $resolved['index'];

		$parent[ $index ] = $operation['block'];

		return true;
	}

	/**
	 * Operation: insert_before
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_insert_before( &$blocks, $operation ) {
		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		if ( ! isset( $operation['blocks'] ) || ! is_array( $operation['blocks'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'insert_before requires blocks array.', 'sg-ai-studio' ) );
		}

		$parent = &$resolved['parent'];
		$index  = $resolved['index'];

		array_splice( $parent, $index, 0, $operation['blocks'] );

		return true;
	}

	/**
	 * Operation: insert_after
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_insert_after( &$blocks, $operation ) {
		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		if ( ! isset( $operation['blocks'] ) || ! is_array( $operation['blocks'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'insert_after requires blocks array.', 'sg-ai-studio' ) );
		}

		$parent = &$resolved['parent'];
		$index  = $resolved['index'];

		array_splice( $parent, $index + 1, 0, $operation['blocks'] );

		return true;
	}

	/**
	 * Operation: insert_child
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_insert_child( &$blocks, $operation ) {
		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		$block = &$resolved['block'];

		if ( ! isset( $operation['blocks'] ) || ! is_array( $operation['blocks'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'insert_child requires blocks array.', 'sg-ai-studio' ) );
		}

		if ( ! isset( $block['innerBlocks'] ) ) {
			$block['innerBlocks'] = array();
		}

		if ( isset( $operation['index'] ) ) {
			$index = (int) $operation['index'];
			array_splice( $block['innerBlocks'], $index, 0, $operation['blocks'] );
		} else {
			$block['innerBlocks'] = array_merge( $block['innerBlocks'], $operation['blocks'] );
		}

		return true;
	}

	/**
	 * Operation: delete
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_delete( &$blocks, $operation ) {
		$resolved = $this->resolve_path( $blocks, $operation['path'] );

		if ( is_wp_error( $resolved ) ) {
			return $resolved;
		}

		$parent = &$resolved['parent'];
		$index  = $resolved['index'];

		array_splice( $parent, $index, 1 );

		return true;
	}

	/**
	 * Operation: move
	 *
	 * @param array $blocks    Block tree.
	 * @param array $operation Operation data.
	 * @return bool|WP_Error   True on success.
	 */
	private function op_move( &$blocks, $operation ) {
		if ( ! isset( $operation['from'] ) || ! isset( $operation['to'] ) ) {
			return new WP_Error( 'invalid_operation', __( 'move requires from and to paths.', 'sg-ai-studio' ) );
		}

		$from_resolved = $this->resolve_path( $blocks, $operation['from'] );
		if ( is_wp_error( $from_resolved ) ) {
			return $from_resolved;
		}

		$block_to_move = $from_resolved['block'];
		$from_parent   = &$from_resolved['parent'];
		$from_index    = $from_resolved['index'];

		array_splice( $from_parent, $from_index, 1 );

		$to_resolved = $this->resolve_path( $blocks, $operation['to'] );
		if ( is_wp_error( $to_resolved ) ) {
			return $to_resolved;
		}

		$to_parent = &$to_resolved['parent'];
		$to_index  = $to_resolved['index'];

		array_splice( $to_parent, $to_index, 0, array( $block_to_move ) );

		return true;
	}

	/**
	 * Persist updated content to entity
	 *
	 * @param string $type    Entity type.
	 * @param mixed  $id      Entity ID.
	 * @param string $content Serialized block markup.
	 * @return bool|WP_Error  True on success, WP_Error on failure.
	 */
	private function persist_entity( $type, $id, $content ) {
		if ( in_array( $type, array( 'page', 'post', 'wp_block' ), true ) ) {
			$result = wp_update_post(
				array(
					'ID'           => (int) $id,
					'post_content' => wp_kses_post( $content ),
				),
				true
			);

			return is_wp_error( $result ) ? $result : true;
		} elseif ( in_array( $type, array( 'template', 'template_part' ), true ) ) {
			$template_type = $type === 'template' ? 'wp_template' : 'wp_template_part';
			$template_post = get_page_by_path( $id, OBJECT, $template_type );

			if ( ! $template_post ) {
				$result = wp_insert_post(
					array(
						'post_type'    => $template_type,
						'post_name'    => $id,
						'post_status'  => 'publish',
						'post_content' => $content,
					),
					true
				);
			} else {
				$result = wp_update_post(
					array(
						'ID'           => $template_post->ID,
						'post_content' => $content,
					),
					true
				);
			}

			return is_wp_error( $result ) ? $result : true;
		}

		return new WP_Error( 'invalid_type', __( 'Invalid entity type.', 'sg-ai-studio' ) );
	}

	/**
	 * Clear caches
	 *
	 * @return void
	 */
	private function clear_caches() {
		if ( function_exists( '\sg_cachepress_purge_cache' ) ) {
			\sg_cachepress_purge_cache();
			\wp_cache_flush();
		} else {
			\wp_cache_flush();
		}
	}

}
