<?php
/**
 * Site Snapshot API class for providing comprehensive site structure
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Rest;

use WP_REST_Response;
use WP_REST_Request;
use WP_Block_Type_Registry;

/**
 * Handles REST API endpoint for site snapshot.
 * Provides a comprehensive site map in a single authenticated read-only call.
 */
class Site_Snapshot extends Rest_Controller_Base {
	/**
	 * REST API base
	 *
	 * @var string
	 */
	private $base = 'site-snapshot';

	/**
	 * Register REST API routes
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->base,
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_site_snapshot' ),
				'permission_callback' => array( $this, 'read_permissions_check' ),
				'args'                => $this->get_snapshot_args(),
				'description'         => 'Retrieves comprehensive site snapshot including theme, templates, posts, pages, and structure.',
			)
		);
	}

	/**
	 * Get arguments for site snapshot
	 *
	 * @return array
	 */
	protected function get_snapshot_args() {
		return array(
			'per_page' => array(
				'description'       => 'Maximum items for posts/pages collections.',
				'type'              => 'integer',
				'default'           => 50,
				'minimum'           => 1,
				'maximum'           => 100,
				'sanitize_callback' => 'absint',
			),
			'offset'   => array(
				'description'       => 'Offset for posts/pages pagination.',
				'type'              => 'integer',
				'default'           => 0,
				'minimum'           => 0,
				'sanitize_callback' => 'absint',
			),
		);
	}

	/**
	 * Get comprehensive site snapshot
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object with site snapshot data.
	 */
	public function get_site_snapshot( $request ) {
		$per_page = $request->get_param( 'per_page' ) ?: 50;
		$offset   = $request->get_param( 'offset' ) ?: 0;

		$snapshot = array(
			'theme'               => $this->get_theme_info(),
			'wp'                  => $this->get_wp_info(),
			'theme_tokens'        => $this->get_theme_tokens(),
			'pages'               => $this->get_lightweight_posts( 'page', $per_page, $offset ),
			'posts'               => $this->get_lightweight_posts( 'post', $per_page, $offset ),
			'templates'           => $this->get_templates(),
			'template_parts'      => $this->get_template_parts(),
			'reusable_blocks'     => $this->get_reusable_blocks(),
			'custom_block_types'  => $this->get_custom_block_types(),
			'pattern_categories'  => $this->get_pattern_categories(),
			'menus'               => $this->get_menus(),
			'post_types'          => $this->get_post_types(),
		);

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $snapshot,
			),
			200
		);
	}

	/**
	 * Get active theme information
	 *
	 * @return array Theme info.
	 */
	private function get_theme_info() {
		$theme  = wp_get_theme();
		$parent = $theme->parent();

		return array(
			'slug'           => $theme->get_stylesheet(),
			'name'           => $theme->get( 'Name' ),
			'version'        => $theme->get( 'Version' ),
			'parent'         => $parent ? $parent->get_stylesheet() : null,
			// Gate for validated block editing: true for block AND hybrid themes.
			'has_theme_json' => function_exists( 'wp_theme_has_theme_json' ) && wp_theme_has_theme_json(),
			// Reserved for Site Editor / template work, not the block editing gate.
			'is_block_theme' => function_exists( 'wp_is_block_theme' ) && wp_is_block_theme(),
		);
	}

	/**
	 * Get WordPress environment info
	 *
	 * Lets the block markup validator pin its core block library to the
	 * version actually installed on the site.
	 *
	 * @return array WordPress version info.
	 */
	private function get_wp_info() {
		return array(
			'version'   => get_bloginfo( 'version' ),
			'gutenberg' => defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null,
		);
	}

	/**
	 * Get theme tokens from theme.json (only theme-defined values, not WP core defaults)
	 *
	 * @return array Theme tokens.
	 */
	private function get_theme_tokens() {
		$tokens = array(
			'colors'         => array(),
			'gradients'      => array(),
			'duotones'       => array(),
			'font_families'  => array(),
			'font_sizes'     => array(),
			'spacing_sizes'  => array(),
			'shadows'        => array(),
			'layout'         => array(),
		);

		if ( ! class_exists( 'WP_Theme_JSON_Resolver' ) ) {
			return $tokens;
		}

		$theme_json = \WP_Theme_JSON_Resolver::get_theme_data();
		if ( ! $theme_json ) {
			return $tokens;
		}

		$settings = $theme_json->get_settings();

		if ( isset( $settings['color']['palette']['theme'] ) ) {
			$tokens['colors'] = $settings['color']['palette']['theme'];
		}

		if ( isset( $settings['color']['gradients']['theme'] ) ) {
			$tokens['gradients'] = $settings['color']['gradients']['theme'];
		}

		if ( isset( $settings['color']['duotone']['theme'] ) ) {
			$tokens['duotones'] = $settings['color']['duotone']['theme'];
		}

		if ( isset( $settings['typography']['fontFamilies']['theme'] ) ) {
			// Slug + name only: the agent references fonts by slug, so the
			// fontFamily/fontFace/src payload is dead weight.
			$tokens['font_families'] = array_map(
				static function ( $font ) {
					return array(
						'slug' => isset( $font['slug'] ) ? $font['slug'] : null,
						'name' => isset( $font['name'] ) ? $font['name'] : null,
					);
				},
				$settings['typography']['fontFamilies']['theme']
			);
		}

		if ( isset( $settings['typography']['fontSizes']['theme'] ) ) {
			$tokens['font_sizes'] = $settings['typography']['fontSizes']['theme'];
		}

		if ( isset( $settings['spacing']['spacingSizes']['theme'] ) ) {
			$tokens['spacing_sizes'] = $settings['spacing']['spacingSizes']['theme'];
		}

		if ( isset( $settings['shadow']['presets']['theme'] ) ) {
			$tokens['shadows'] = $settings['shadow']['presets']['theme'];
		}

		if ( isset( $settings['layout'] ) ) {
			$tokens['layout'] = $settings['layout'];
		}

		return $tokens;
	}

	/**
	 * Get lightweight posts or pages (capped and paginated)
	 *
	 * @param string $post_type Post type slug.
	 * @param int    $per_page  Number of items per page.
	 * @param int    $offset    Offset for pagination.
	 * @return array Lightweight post data.
	 */
	private function get_lightweight_posts( $post_type, $per_page, $offset ) {
		$query = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'future', 'private' ),
				'posts_per_page' => $per_page,
				'offset'         => $offset,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'no_found_rows'  => true,
			)
		);

		$items = array();
		foreach ( $query->posts as $post ) {
			$items[] = array(
				'id'       => $post->ID,
				'slug'     => $post->post_name,
				'title'    => $post->post_title,
				'status'   => $post->post_status,
				'parent'   => $post->post_parent,
				'template' => get_page_template_slug( $post->ID ) ?: '',
			);
		}

		return $items;
	}

	/**
	 * Get block theme templates
	 *
	 * @return array Templates data.
	 */
	private function get_templates() {
		if ( ! function_exists( 'wp_is_block_theme' ) || ! wp_is_block_theme() ) {
			return array();
		}

		$templates = array();

		if ( function_exists( 'get_block_templates' ) ) {
			$block_templates = get_block_templates();
			foreach ( $block_templates as $template ) {
				$templates[] = array(
					'id'     => $template->id,
					'slug'   => $template->slug,
					'title'  => $template->title,
					'source' => $template->source,
					'area'   => isset( $template->area ) ? $template->area : null,
				);
			}
		}

		return $templates;
	}

	/**
	 * Get block theme template parts
	 *
	 * @return array Template parts data.
	 */
	private function get_template_parts() {
		if ( ! function_exists( 'wp_is_block_theme' ) || ! wp_is_block_theme() ) {
			return array();
		}

		$template_parts = array();

		if ( function_exists( 'get_block_templates' ) ) {
			$block_template_parts = get_block_templates( array(), 'wp_template_part' );
			foreach ( $block_template_parts as $part ) {
				$template_parts[] = array(
					'id'     => $part->id,
					'slug'   => $part->slug,
					'title'  => $part->title,
					'source' => $part->source,
					'area'   => isset( $part->area ) ? $part->area : null,
				);
			}
		}

		return $template_parts;
	}

	/**
	 * Get reusable blocks
	 *
	 * @return array Reusable blocks data.
	 */
	private function get_reusable_blocks() {
		$reusable_query = new \WP_Query(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'no_found_rows'  => true,
			)
		);

		$blocks = array();
		foreach ( $reusable_query->posts as $block ) {
			$blocks[] = array(
				'id'    => $block->ID,
				'slug'  => $block->post_name,
				'title' => $block->post_title,
			);
		}

		return $blocks;
	}

	/**
	 * Get custom block types (non-core only)
	 *
	 * Names only (name, title, category) - this is the validator's skip list.
	 * Per-type block schemas are a separate on-demand fetch, not part of the snapshot.
	 *
	 * @return array Custom block types.
	 */
	private function get_custom_block_types() {
		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			return array();
		}

		$registry      = WP_Block_Type_Registry::get_instance();
		$all_blocks    = $registry->get_all_registered();
		$custom_blocks = array();

		foreach ( $all_blocks as $block_name => $block_type ) {
			if ( strpos( $block_name, 'core/' ) === 0 ) {
				continue;
			}

			$custom_blocks[] = array(
				'name'     => $block_name,
				'title'    => isset( $block_type->title ) ? $block_type->title : '',
				'category' => isset( $block_type->category ) ? $block_type->category : null,
			);
		}

		return $custom_blocks;
	}

	/**
	 * Get pattern categories with counts.
	 *
	 * Tallies the categories referenced by every registered block pattern and
	 * returns a map of category slug => number of patterns in that category.
	 *
	 * @return object Map of category slug to pattern count.
	 */
	private function get_pattern_categories() {
		if ( ! class_exists( 'WP_Block_Patterns_Registry' ) ) {
			return (object) array();
		}

		$patterns = \WP_Block_Patterns_Registry::get_instance()->get_all_registered();
		$counts   = array();

		foreach ( $patterns as $pattern ) {
			if ( empty( $pattern['categories'] ) || ! is_array( $pattern['categories'] ) ) {
				continue;
			}

			foreach ( $pattern['categories'] as $category ) {
				if ( ! isset( $counts[ $category ] ) ) {
					$counts[ $category ] = 0;
				}
				$counts[ $category ]++;
			}
		}

		ksort( $counts );

		// Cast to object so it always JSON-encodes as an object, even when empty.
		return (object) $counts;
	}

	/**
	 * Get navigation menus
	 *
	 * @return array Menus data.
	 */
	private function get_menus() {
		$nav_menus      = wp_get_nav_menus();
		$menu_locations = get_nav_menu_locations();
		$menus          = array();

		foreach ( $nav_menus as $menu ) {
			$locations = array();
			foreach ( $menu_locations as $location => $menu_id ) {
				if ( (int) $menu_id === (int) $menu->term_id ) {
					$locations[] = $location;
				}
			}

			$menus[] = array(
				'id'        => $menu->term_id,
				'name'      => $menu->name,
				'slug'      => $menu->slug,
				'locations' => $locations,
			);
		}

		return $menus;
	}

	/**
	 * Get registered post types (lightweight)
	 *
	 * @return array Post types data.
	 */
	private function get_post_types() {
		$post_types = get_post_types(
			array(
				'show_in_rest' => true,
			),
			'objects'
		);

		$result = array();
		foreach ( $post_types as $post_type ) {
			$result[] = array(
				'slug'         => $post_type->name,
				'name'         => $post_type->label,
				'rest_base'    => ! empty( $post_type->rest_base ) ? $post_type->rest_base : $post_type->name,
				'hierarchical' => (bool) $post_type->hierarchical,
			);
		}

		return $result;
	}
}
