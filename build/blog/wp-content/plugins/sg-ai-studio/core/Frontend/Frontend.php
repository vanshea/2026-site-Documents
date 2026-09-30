<?php
/**
 * Frontend class for managing frontend interface
 *
 * @package SG_AI_Studio
 */

namespace SG_AI_Studio\Frontend;

use SG_AI_Studio;
use SG_AI_Studio\Helper\Helper;
use SG_AI_Studio\Vendor\SiteGround_i18n\i18n_Service;

/**
 * Handle all hooks for frontend AI chat integration.
 */
class Frontend {

	/**
	 * Register the JavaScript for the frontend area.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function enqueue_scripts() {
		global $wp_version;

		// Bail if not on frontend or user is not an administrator.
		if ( is_admin() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Enqueue the chat script.
		wp_enqueue_script(
			'siteground-ai-studio-chat',
			\SG_AI_Studio\URL . '/assets/js/chat.js',
			array( 'jquery' ),
			\SG_AI_Studio\VERSION,
			true
		);

		// Get user ID for transient.
		$user_id = get_current_user_id();

		// Get thread_id from request or from user-specific transient.
		$thread_id = get_transient( 'sg_ai_studio_thread_id_' . $user_id );

		// This function is required to check for active plugins.
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// Check if WooCommerce is active to provide contextual suggestions.
		if ( is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			// --- WOOCOMMERCE-SPECIFIC WELCOME MESSAGE ---
			$welcome_message_string = __(
				"**Hi! I am your WordPress AI Assistant. How can I help you manage your store today?**",
				'sg-ai-studio'
			);
		} else {
			// --- STANDARD WORDPRESS WELCOME MESSAGE ---
			$welcome_message_string = __(
				"**Hi! I am your WordPress AI Assistant. How can I help you manage your site today?**",
				'sg-ai-studio'
			);
		}

		// Create i18n service instance.
		$i18n_service = new i18n_Service( 'sg-ai-studio' );

		// Derive the current page context (re-derived on every load, never cached).
		$page_context = Helper::get_page_context();

		// Localize the script with necessary data.
		$localized_data = array(
			'config'       => array(
				'home_url'         => get_home_url(),
				'rest_base'        => rtrim( esc_url_raw( rest_url() ), '/' ),
				'threadId'         => $thread_id,
				'localeSlug'       => join( '-', explode( '_', \get_user_locale() ) ),
				'locale'           => $i18n_service->get_i18n_data_json(),
				'wp_nonce'         => wp_create_nonce( 'wp_rest' ),
				'assetsPath'       => \SG_AI_Studio\URL . '/assets/',
				'is_staging'       => Helper::is_staging_environment(),
				'welcome_msg'      => $welcome_message_string,
				'minimizeOverride' => false, // Always start minimized on frontend.
				'plugin_version'   => \SG_AI_Studio\VERSION,
				'wp_version'       => $wp_version,
				'chat_bubble_fe_hidden' => (bool) get_option( 'sg_ai_studio_chat_bubble_fe_hidden', false ),
				'defaultDisplayMode'      => get_option( 'sg_ai_studio_chat_display_mode_frontend', 'popover' ),
				'chatSource'       => 'wp_frontend_chatbox',
				'quickActions'     => array(
					'categories'   => array(
							array(
								'type'  => 'most-popular',
								'title' => __( 'Most Popular', 'sg-ai-studio' ),
								'icon'  => 'star',
							),
							array(
								'type'  => 'create-and-manage-content',
								'title' => __( 'Create & Manage Content', 'sg-ai-studio' ),
								'icon'  => 'edit_square',
							),
							array(
								'type'  => 'optimize-and-protect',
								'title' => __( 'Optimize & Protect', 'sg-ai-studio' ),
								'icon'  => 'trending_up',
							),
							array(
								'type'  => 'store',
								'title' => __( 'Store', 'sg-ai-studio' ),
								'icon'  => 'shopping_cart',
							),
					),
					'actions'      => array(
							'most-popular'        => array(
								__( 'Write an SEO-friendly blog post with AI images and headings', 'sg-ai-studio' ),
								__( 'Run a full SEO audit of my site', 'sg-ai-studio' ),
								__( 'Speed up my site automatically (with SiteGround Speed Optimizer)', 'sg-ai-studio' ),
							),
							'create-and-manage-content' => array(
								__( 'Create a new page from scratch (with Gutenberg building blocks)', 'sg-ai-studio' ),
								__( 'Improve an existing post - rewrite for SEO and readability', 'sg-ai-studio' ),
								__( 'Create 10 blog post title ideas', 'sg-ai-studio' ),
								__( 'Clean up my site - remove sample pages and spam comments', 'sg-ai-studio' ),
							),
							'optimize-and-protect'   => array(
								__( 'Speed - Optimize site performance (caching, images, CSS via SiteGround Speed Optimizer)', 'sg-ai-studio' ),
								__( 'Secure my site - Apply recommended security hardening (via Security Optimizer)', 'sg-ai-studio' ),
								__( 'Update my site, plugins and themes', 'sg-ai-studio' ),
								__( 'Run a full SEO audit of my site', 'sg-ai-studio' ),
							),
							'store'        => array(
								__( 'Generate sales report for last week including best selling products', 'sg-ai-studio' ),
								__( 'Show pending orders and help me process them', 'sg-ai-studio' ),
								__( 'Create a discount coupon', 'sg-ai-studio' ),
								__( 'Generate product descriptions (for WooCommerce)', 'sg-ai-studio' ),
							),
					),
					'actionsTitle' => __( 'Suggested actions', 'sg-ai-studio' ),
				),
			),
			'page'         => 'chat',
			'domElementId' => 'wp-ai-studio-container',
		);

		// Only expose page_context when the current page could be determined.
		if ( null !== $page_context ) {
			$localized_data['config']['page_context'] = $page_context;
		}

		wp_localize_script(
			'siteground-ai-studio-chat',
			'WPAIStudioConfig',
			$localized_data
		);
	}

	/**
	 * Add floating chat widget to frontend footer
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function add_floating_chat() {
		// Only show for users who can manage options on frontend.
		if ( is_admin() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$api_key = get_option( 'sg_ai_studio_api_key', '' );

		wp_add_inline_script(
			'siteground-ai-studio-chat',
			'jQuery( document ).ready(function() {WPAIStudioChat.init(WPAIStudioConfig);});',
			'after'
		);

		?>
		<div id="wp-ai-studio-container" class="sg-ai-floating-chat <?php echo empty( $api_key ) ? 'no-api-key' : ''; ?>"></div>
		<?php
	}
}
