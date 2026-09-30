<?php
/**
 * Shared revision endpoints for post-like REST controllers.
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;
use SG_AI_Studio\Activity_Log\Activity_Log_Helper;

/**
 * Provides list / read / restore / prune revision endpoints.
 *
 * Consumed by the Posts and Pages controllers so the handlers live in one place.
 * Revisions cover title, content and excerpt only; featured image, meta,
 * taxonomy and status are not part of a revision and are intentionally not
 * exposed here.
 */
trait Revisions {
	/**
	 * Optional post type the revision endpoints are constrained to.
	 *
	 * When set (e.g. 'page'), the parent must be of this type or the request 404s.
	 * When null, any post type is accepted (parity with the posts controller).
	 *
	 * @var string|null
	 */
	protected $revision_post_type = null;

	/**
	 * Register the revision sub-routes for a controller.
	 *
	 * @param string      $base      REST base of the parent resource (e.g. 'posts').
	 * @param string|null $post_type Optional post type constraint for the parent.
	 * @return void
	 */
	public function register_revision_routes( $base, $post_type = null ) {
		$this->revision_post_type = $post_type;

		// List revisions for a post.
		register_rest_route(
			$this->namespace,
			'/' . $base . '/(?P<id>[\d]+)/revisions',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_revisions' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => 'Unique identifier for the parent post.',
							'type'        => 'integer',
							'required'    => true,
						),
					),
					'description'         => 'Lists the revisions of a post.',
				),
			)
		);

		// Read or prune a single revision.
		register_rest_route(
			$this->namespace,
			'/' . $base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_revision' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
					'args'                => $this->get_revision_route_args(),
					'description'         => 'Retrieves the title, content and excerpt of a single revision.',
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( $this, 'delete_revision' ),
					'permission_callback' => array( $this, 'delete_permissions_check' ),
					'args'                => $this->get_revision_route_args(),
					'description'         => 'Permanently deletes a single revision.',
				),
			)
		);

		// Restore a revision (non-destructive: creates a new revision).
		register_rest_route(
			$this->namespace,
			'/' . $base . '/(?P<id>[\d]+)/revisions/(?P<revision_id>[\d]+)/restore',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'restore_revision' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => $this->get_revision_route_args(),
					'description'         => 'Restores a revision. Non-destructive: a new revision is created.',
				),
			)
		);
	}

	/**
	 * Route args shared by the single-revision endpoints.
	 *
	 * @return array
	 */
	protected function get_revision_route_args() {
		return array(
			'id'          => array(
				'description' => 'Unique identifier for the parent post.',
				'type'        => 'integer',
				'required'    => true,
			),
			'revision_id' => array(
				'description' => 'Unique identifier for the revision.',
				'type'        => 'integer',
				'required'    => true,
			),
		);
	}

	/**
	 * List the revisions of a post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_revisions( $request ) {
		$post_id = (int) $request['id'];
		$post    = $this->get_validated_revision_parent( $post_id );

		if ( null === $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$revisions = wp_get_post_revisions( $post_id );
		$data      = array();

		foreach ( $revisions as $revision ) {
			// Skip autosaves; only true restore points are listed.
			if ( false !== strpos( $revision->post_name, $post_id . '-autosave' ) ) {
				continue;
			}

			$data[] = array(
				'id'          => $revision->ID,
				'author'      => (int) $revision->post_author,
				'author_name' => get_the_author_meta( 'display_name', $revision->post_author ),
				'date'        => mysql_to_rfc3339( $revision->post_date ),
				'date_gmt'    => mysql_to_rfc3339( $revision->post_date_gmt ),
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'revisions_enabled' => wp_revisions_enabled( $post ),
					'revisions'         => $data,
				),
			),
			200
		);
	}

	/**
	 * Retrieve a single revision's content.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_revision( $request ) {
		$post_id     = (int) $request['id'];
		$revision_id = (int) $request['revision_id'];

		if ( null === $this->get_validated_revision_parent( $post_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$revision = $this->validate_revision_belongs_to_post( $revision_id, $post_id );

		if ( null === $revision ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid revision ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'id'      => $revision->ID,
					'parent'  => (int) $revision->post_parent,
					'title'   => $revision->post_title,
					'content' => $revision->post_content,
					'excerpt' => $revision->post_excerpt,
					'author'  => (int) $revision->post_author,
					'date'    => mysql_to_rfc3339( $revision->post_date ),
				),
			),
			200
		);
	}

	/**
	 * Restore a revision. Non-destructive: WordPress creates a new revision of the
	 * pre-restore state when revisions are enabled.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function restore_revision( $request ) {
		$post_id     = (int) $request['id'];
		$revision_id = (int) $request['revision_id'];
		$post        = $this->get_validated_revision_parent( $post_id );

		if ( null === $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		if ( null === $this->validate_revision_belongs_to_post( $revision_id, $post_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid revision ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$restored = wp_restore_post_revision( $revision_id );

		if ( empty( $restored ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'The revision could not be restored.', 'sg-ai-studio' ),
				),
				500
			);
		}

		// The newest revision after restore is the snapshot of the pre-restore
		// state. It only exists when revisions are enabled on this site.
		$revisions_enabled = wp_revisions_enabled( $post );
		$new_revision_id   = null;

		if ( $revisions_enabled ) {
			$new_revisions   = wp_get_post_revisions(
				$post_id,
				array(
					'numberposts' => 1,
					'fields'      => 'ids',
				)
			);
			$new_revision_id = ! empty( $new_revisions ) ? (int) reset( $new_revisions ) : null;
		}

		// Log the activity.
		Activity_Log_Helper::add_log_entry(
			$this->get_revision_log_context(),
			/* translators: %1$s is the post title, %2$d is the post ID, %3$d is the restored revision ID. */
			sprintf( __( 'Revision Restored: %1$s (ID: %2$d, Revision: %3$d)', 'sg-ai-studio' ), $post->post_title, $post_id, $revision_id )
		);

		$this->purge_revision_caches();

		return new WP_REST_Response(
			array(
				'success'           => true,
				'id'                => $post_id,
				'restored_from'     => $revision_id,
				'new_revision_id'   => $new_revision_id,
				'revisions_enabled' => $revisions_enabled,
			),
			200
		);
	}

	/**
	 * Permanently delete a single revision.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function delete_revision( $request ) {
		$post_id     = (int) $request['id'];
		$revision_id = (int) $request['revision_id'];
		$post        = $this->get_validated_revision_parent( $post_id );

		if ( null === $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid post ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		if ( null === $this->validate_revision_belongs_to_post( $revision_id, $post_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid revision ID.', 'sg-ai-studio' ),
				),
				404
			);
		}

		$deleted = wp_delete_post_revision( $revision_id );

		if ( ! $deleted || is_wp_error( $deleted ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'The revision could not be deleted.', 'sg-ai-studio' ),
				),
				500
			);
		}

		// Log the activity.
		Activity_Log_Helper::add_log_entry(
			$this->get_revision_log_context(),
			/* translators: %1$s is the post title, %2$d is the post ID, %3$d is the deleted revision ID. */
			sprintf( __( 'Revision Deleted: %1$s (ID: %2$d, Revision: %3$d)', 'sg-ai-studio' ), $post->post_title, $post_id, $revision_id )
		);

		$this->purge_revision_caches();

		return new WP_REST_Response(
			array(
				'success'             => true,
				'id'                  => $post_id,
				'deleted_revision_id' => $revision_id,
			),
			200
		);
	}

	/**
	 * Validate and fetch the parent post for a revision request.
	 *
	 * @param int $post_id Parent post ID.
	 * @return \WP_Post|null The parent post, or null when invalid / type mismatch.
	 */
	protected function get_validated_revision_parent( $post_id ) {
		$post = get_post( $post_id );

		if ( is_wp_error( $post ) || ! $post ) {
			return null;
		}

		if ( null !== $this->revision_post_type && $this->revision_post_type !== $post->post_type ) {
			return null;
		}

		return $post;
	}

	/**
	 * Validate that a revision exists and belongs to the given parent post.
	 *
	 * @param int $revision_id Revision ID.
	 * @param int $post_id     Parent post ID.
	 * @return \WP_Post|null The revision, or null when invalid / mismatched.
	 */
	protected function validate_revision_belongs_to_post( $revision_id, $post_id ) {
		$revision = get_post( $revision_id );

		if ( is_wp_error( $revision ) || ! $revision ) {
			return null;
		}

		if ( 'revision' !== $revision->post_type || (int) $revision->post_parent !== (int) $post_id ) {
			return null;
		}

		return $revision;
	}

	/**
	 * Activity log context label for the current resource type.
	 *
	 * @return string
	 */
	protected function get_revision_log_context() {
		return 'page' === $this->revision_post_type ? 'Pages' : 'Posts';
	}

	/**
	 * Clear caches after a revision mutation, mirroring the other controllers.
	 *
	 * @return void
	 */
	protected function purge_revision_caches() {
		if ( \function_exists( '\sg_cachepress_purge_cache' ) ) {
			\sg_cachepress_purge_cache();
			\wp_cache_flush();
		} else {
			\wp_cache_flush();
		}
	}
}
