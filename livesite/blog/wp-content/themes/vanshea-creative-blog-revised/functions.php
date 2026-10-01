<?php
/**
 * Theme setup for Van Shea Creative Blog.
 *
 * @package VanSheaCreativeBlog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function vanshea_creative_blog_setup() {
	load_theme_textdomain( 'vanshea-creative-blog', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'vanshea-creative-blog' ),
		)
	);
}
add_action( 'after_setup_theme', 'vanshea_creative_blog_setup' );

function vanshea_creative_blog_theme_choices() {
	return array(
		'theme1' => __( 'Clear', 'vanshea-creative-blog' ),
		'theme3' => __( 'Contrast', 'vanshea-creative-blog' ),
		'theme4' => __( 'Bold', 'vanshea-creative-blog' ),
		'theme5' => __( 'Wild', 'vanshea-creative-blog' ),
	);
}

function vanshea_creative_blog_sanitize_theme_choice( $value ) {
	$choices = vanshea_creative_blog_theme_choices();

	return array_key_exists( $value, $choices ) ? $value : 'theme4';
}

function vanshea_creative_blog_sanitize_checkbox( $checked ) {
	return (bool) $checked;
}

function vanshea_creative_blog_get_default_theme() {
	return vanshea_creative_blog_sanitize_theme_choice( get_theme_mod( 'vsc_default_theme', 'theme4' ) );
}

function vanshea_creative_blog_customizer( $wp_customize ) {
	$wp_customize->add_section(
		'vsc_theme_options',
		array(
			'title'       => __( 'Van Shea Theme Options', 'vanshea-creative-blog' ),
			'description' => __( 'Controls for the visitor color theme and footer text.', 'vanshea-creative-blog' ),
			'priority'    => 160,
		)
	);

	$wp_customize->add_setting(
		'vsc_default_theme',
		array(
			'default'           => 'theme4',
			'sanitize_callback' => 'vanshea_creative_blog_sanitize_theme_choice',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'vsc_default_theme',
		array(
			'label'   => __( 'Default theme', 'vanshea-creative-blog' ),
			'section' => 'vsc_theme_options',
			'type'    => 'select',
			'choices' => vanshea_creative_blog_theme_choices(),
		)
	);

	$wp_customize->add_setting(
		'vsc_show_theme_switcher',
		array(
			'default'           => true,
			'sanitize_callback' => 'vanshea_creative_blog_sanitize_checkbox',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'vsc_show_theme_switcher',
		array(
			'label'   => __( 'Show footer theme switcher', 'vanshea-creative-blog' ),
			'section' => 'vsc_theme_options',
			'type'    => 'checkbox',
		)
	);

	$wp_customize->add_setting(
		'vsc_footer_text',
		array(
			'default'           => __( 'Van Shea Sedita · Van Shea Creative · Human Agency Design', 'vanshea-creative-blog' ),
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'refresh',
		)
	);

	$wp_customize->add_control(
		'vsc_footer_text',
		array(
			'label'   => __( 'Footer text after year', 'vanshea-creative-blog' ),
			'section' => 'vsc_theme_options',
			'type'    => 'text',
		)
	);
}
add_action( 'customize_register', 'vanshea_creative_blog_customizer' );

function vanshea_creative_blog_assets() {
	$theme_version  = wp_get_theme()->get( 'Version' );
	$style_path     = get_stylesheet_directory() . '/style.css';
	$script_path    = get_template_directory() . '/assets/theme.js';
	$style_version  = file_exists( $style_path ) ? (string) filemtime( $style_path ) : $theme_version;
	$script_version = file_exists( $script_path ) ? (string) filemtime( $script_path ) : $theme_version;

	wp_enqueue_style(
		'vanshea-creative-fonts',
		'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Open+Sans:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'vanshea-creative-blog-style',
		get_stylesheet_uri(),
		array( 'vanshea-creative-fonts' ),
		$style_version
	);

	wp_enqueue_script(
		'vanshea-creative-blog-script',
		get_template_directory_uri() . '/assets/theme.js',
		array(),
		$script_version,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'vanshea_creative_blog_assets' );

function vanshea_creative_blog_excerpt_length() {
	return 24;
}
add_filter( 'excerpt_length', 'vanshea_creative_blog_excerpt_length' );

function vanshea_creative_blog_excerpt_more() {
	return '...';
}
add_filter( 'excerpt_more', 'vanshea_creative_blog_excerpt_more' );

function vanshea_creative_blog_posted_on() {
	printf(
		'<span class="posted-on">%1$s</span>',
		esc_html( get_the_date() )
	);
}

function vanshea_creative_blog_posted_by() {
	printf(
		'<span class="byline">%1$s</span>',
		esc_html( get_the_author() )
	);
}

function vanshea_creative_blog_reading_time( $post_id = null ) {
	$post_id    = $post_id ? $post_id : get_the_ID();
	$word_count = str_word_count( wp_strip_all_tags( get_post_field( 'post_content', $post_id ) ) );
	$minutes    = max( 1, (int) ceil( $word_count / 220 ) );

	printf(
		/* translators: %s: estimated number of reading minutes. */
		esc_html( _n( '%s min read', '%s min read', $minutes, 'vanshea-creative-blog' ) ),
		esc_html( number_format_i18n( $minutes ) )
	);
}

function vanshea_creative_blog_get_first_content_image_url( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$post    = get_post( $post_id );

	if ( ! $post || empty( $post->post_content ) ) {
		return '';
	}

	if ( preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $post->post_content, $matches ) ) {
		return esc_url_raw( html_entity_decode( $matches[1] ) );
	}

	return '';
}

function vanshea_creative_blog_get_attached_image_id( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();

	$attachments = get_children(
		array(
			'post_parent'    => $post_id,
			'post_type'      => 'attachment',
			'post_mime_type' => 'image',
			'numberposts'    => 1,
			'orderby'        => 'menu_order date',
			'order'          => 'ASC',
			'fields'         => 'ids',
		)
	);

	if ( empty( $attachments ) ) {
		return 0;
	}

	return (int) reset( $attachments );
}

function vanshea_creative_blog_post_image( $size = 'large', $class = '' ) {
	$post_id = get_the_ID();

	if ( has_post_thumbnail( $post_id ) ) {
		the_post_thumbnail(
			$size,
			array(
				'class' => $class,
			)
		);
		return true;
	}

	$attachment_id = vanshea_creative_blog_get_attached_image_id( $post_id );
	if ( $attachment_id ) {
		echo wp_get_attachment_image(
			$attachment_id,
			$size,
			false,
			array(
				'class' => $class,
			)
		);
		return true;
	}

	$content_image_url = vanshea_creative_blog_get_first_content_image_url( $post_id );
	if ( $content_image_url ) {
		printf(
			'<img class="%1$s" src="%2$s" alt="%3$s" loading="lazy">',
			esc_attr( $class ),
			esc_url( $content_image_url ),
			esc_attr( get_the_title( $post_id ) )
		);
		return true;
	}

	return false;
}

function vanshea_creative_blog_repair_missing_featured_images() {
	$updated = 0;
	$checked = 0;
	$query   = new WP_Query(
		array(
			'post_type'      => array( 'post', 'page' ),
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		)
	);

	foreach ( $query->posts as $post_id ) {
		if ( has_post_thumbnail( $post_id ) ) {
			continue;
		}

		$checked++;
		$attachment_id = vanshea_creative_blog_get_attached_image_id( $post_id );
		if ( ! $attachment_id ) {
			continue;
		}

		if ( set_post_thumbnail( $post_id, $attachment_id ) ) {
			$updated++;
		}
	}

	$mapped_result = vanshea_creative_blog_set_featured_images_from_map();

	return array(
		'updated' => $updated + $mapped_result['updated'],
		'checked' => $checked + $mapped_result['checked'],
	);
}

/**
 * Run the repair as a dedicated admin action and save a durable result.
 */
function vanshea_creative_blog_handle_featured_image_repair() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You do not have permission to repair featured images.', 'vanshea-creative-blog' ) );
	}

	check_admin_referer( 'vsc_repair_featured_images' );

	$result                 = vanshea_creative_blog_repair_missing_featured_images();
	$result['completed_at'] = time();
	update_option( 'vsc_featured_image_repair_result', $result, false );

	wp_safe_redirect(
		add_query_arg(
			'vsc_featured_image_repair',
			'complete',
			admin_url( 'edit.php' )
		)
	);
	exit;
}
add_action( 'admin_post_vsc_repair_featured_images', 'vanshea_creative_blog_handle_featured_image_repair' );

function vanshea_creative_blog_set_featured_images_from_map() {
	$map_file = get_template_directory() . '/data/featured-image-map.php';
	if ( ! file_exists( $map_file ) ) {
		return array(
			'checked' => 0,
			'updated' => 0,
		);
	}

	$map     = include $map_file;
	$checked = 0;
	$updated = 0;

	if ( ! is_array( $map ) ) {
		return array(
			'checked' => 0,
			'updated' => 0,
		);
	}

	foreach ( $map as $entry ) {
		$post = vanshea_creative_blog_find_imported_post( $entry );
		if ( ! $post || has_post_thumbnail( $post ) ) {
			continue;
		}

		$checked++;
		$attachment_id = vanshea_creative_blog_find_or_create_attachment_from_url( $entry['image'], $post->ID );

		if ( $attachment_id && set_post_thumbnail( $post->ID, $attachment_id ) ) {
			$updated++;
		}
	}

	return array(
		'checked' => $checked,
		'updated' => $updated,
	);
}

function vanshea_creative_blog_find_imported_post( $entry ) {
	$post_types = array_filter(
		array( 'post', 'page', 'jetpack-portfolio' ),
		'post_type_exists'
	);
	$slug       = isset( $entry['slug'] ) ? sanitize_title( $entry['slug'] ) : '';
	$title      = isset( $entry['title'] ) ? wp_strip_all_tags( $entry['title'] ) : '';

	if ( $slug ) {
		$post = get_page_by_path( $slug, OBJECT, $post_types );
		if ( $post ) {
			return $post;
		}
	}

	if ( $title ) {
		$query = new WP_Query(
			array(
				'post_type'              => $post_types,
				'post_status'            => 'any',
				'title'                  => $title,
				'posts_per_page'         => 1,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( $query->have_posts() ) {
			return $query->posts[0];
		}
	}

	return null;
}

function vanshea_creative_blog_upload_relative_path_from_url( $url ) {
	$path = wp_parse_url( $url, PHP_URL_PATH );
	if ( ! $path ) {
		return '';
	}

	$needle = '/wp-content/uploads/';
	$pos    = strpos( $path, $needle );
	if ( false === $pos ) {
		return '';
	}

	return ltrim( substr( $path, $pos + strlen( $needle ) ), '/' );
}

function vanshea_creative_blog_find_attachment_by_relative_path( $relative_path ) {
	$relative_path = ltrim( $relative_path, '/' );
	$basename      = wp_basename( $relative_path );

	$attachments = get_posts(
		array(
			'post_type'              => 'attachment',
			'post_status'            => 'inherit',
			'posts_per_page'         => 1,
			'fields'                 => 'ids',
			'meta_key'               => '_wp_attached_file',
			'meta_value'             => $relative_path,
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	if ( ! empty( $attachments ) ) {
		return (int) $attachments[0];
	}

	$attachments = get_posts(
		array(
			'post_type'              => 'attachment',
			'post_status'            => 'inherit',
			'posts_per_page'         => 1,
			'fields'                 => 'ids',
			'meta_key'               => '_wp_attached_file',
			'meta_value'             => $basename,
			'meta_compare'           => 'LIKE',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	return empty( $attachments ) ? 0 : (int) $attachments[0];
}

function vanshea_creative_blog_find_upload_file( $relative_path ) {
	static $file_index = null;

	$uploads       = wp_get_upload_dir();
	$relative_path = ltrim( $relative_path, '/' );
	$exact_path    = trailingslashit( $uploads['basedir'] ) . $relative_path;

	if ( file_exists( $exact_path ) ) {
		return $exact_path;
	}

	if ( empty( $uploads['basedir'] ) || ! is_dir( $uploads['basedir'] ) ) {
		return '';
	}

	$basename      = wp_basename( $relative_path );
	$original_name = preg_replace( '/-\d+x\d+(?=\.[^.]+$)/', '', $basename );
	$candidates    = array_unique( array_filter( array( $basename, $original_name ) ) );

	if ( null === $file_index ) {
		$file_index = array();

		try {
			$iterator = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $uploads['basedir'], FilesystemIterator::SKIP_DOTS )
			);

			foreach ( $iterator as $file ) {
				if ( ! $file->isFile() ) {
					continue;
				}

				$file_basename = strtolower( $file->getBasename() );
				if ( ! isset( $file_index[ $file_basename ] ) ) {
					$file_index[ $file_basename ] = $file->getPathname();
				}
			}
		} catch ( UnexpectedValueException $exception ) {
			$file_index = array();
		}
	}

	foreach ( $candidates as $candidate ) {
		$candidate = strtolower( $candidate );
		if ( isset( $file_index[ $candidate ] ) && is_readable( $file_index[ $candidate ] ) ) {
			return $file_index[ $candidate ];
		}
	}

	return '';
}

function vanshea_creative_blog_create_attachment_from_file( $file_path, $post_id ) {
	$uploads       = wp_get_upload_dir();
	$relative_path = ltrim( str_replace( trailingslashit( $uploads['basedir'] ), '', $file_path ), '/' );
	$filetype      = wp_check_filetype( $file_path );

	if ( empty( $filetype['type'] ) ) {
		return 0;
	}

	$attachment_id = wp_insert_attachment(
		array(
			'guid'           => trailingslashit( $uploads['baseurl'] ) . $relative_path,
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', wp_basename( $file_path ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		),
		$file_path,
		$post_id
	);

	if ( is_wp_error( $attachment_id ) ) {
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';
	wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $file_path ) );

	return (int) $attachment_id;
}

function vanshea_creative_blog_sideload_attachment_from_url( $url, $post_id ) {
	if ( ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$tmp = download_url( $url, 20 );
	if ( is_wp_error( $tmp ) ) {
		return 0;
	}

	$file_array = array(
		'name'     => wp_basename( wp_parse_url( $url, PHP_URL_PATH ) ),
		'tmp_name' => $tmp,
	);

	$attachment_id = media_handle_sideload( $file_array, $post_id );
	if ( is_wp_error( $attachment_id ) ) {
		@unlink( $tmp );
		return 0;
	}

	return (int) $attachment_id;
}

function vanshea_creative_blog_find_or_create_attachment_from_url( $url, $post_id ) {
	$relative_path = vanshea_creative_blog_upload_relative_path_from_url( $url );
	if ( ! $relative_path ) {
		$url_path      = wp_parse_url( $url, PHP_URL_PATH );
		$relative_path = $url_path ? wp_basename( rawurldecode( $url_path ) ) : '';
	}

	if ( $relative_path ) {
		$attachment_id = vanshea_creative_blog_find_attachment_by_relative_path( $relative_path );
		if ( $attachment_id ) {
			return $attachment_id;
		}

		$file_path = vanshea_creative_blog_find_upload_file( $relative_path );
		if ( $file_path ) {
			return vanshea_creative_blog_create_attachment_from_file( $file_path, $post_id );
		}
	}

	$allow_remote_sideload = apply_filters( 'vanshea_creative_blog_allow_remote_featured_image_sideload', false, $url, $post_id );

	if ( $allow_remote_sideload ) {
		return vanshea_creative_blog_sideload_attachment_from_url( $url, $post_id );
	}

	return 0;
}

function vanshea_creative_blog_featured_image_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->base, array( 'edit', 'themes' ), true ) ) {
		return;
	}

	if ( 'edit' === $screen->base && 'post' !== $screen->post_type ) {
		return;
	}

	$result_status = isset( $_GET['vsc_featured_image_repair'] ) ? sanitize_key( wp_unslash( $_GET['vsc_featured_image_repair'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$last_result   = get_option( 'vsc_featured_image_repair_result', array() );

	if ( 'complete' === $result_status && is_array( $last_result ) ) {
		$updated = isset( $last_result['updated'] ) ? absint( $last_result['updated'] ) : 0;
		$checked = isset( $last_result['checked'] ) ? absint( $last_result['checked'] ) : 0;
		printf(
			'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
			esc_html(
				sprintf(
					/* translators: 1: number of updated posts, 2: number of checked posts. */
					__( 'Featured image repair completed: %1$s images assigned after checking %2$s candidates. Unmatched posts need a manual featured image selection.', 'vanshea-creative-blog' ),
					number_format_i18n( $updated ),
					number_format_i18n( $checked )
				)
			)
		);
		return;
	}

	if ( is_array( $last_result ) && ! empty( $last_result['completed_at'] ) ) {
		return;
	}

	$url = wp_nonce_url(
		add_query_arg( 'action', 'vsc_repair_featured_images', admin_url( 'admin-post.php' ) ),
		'vsc_repair_featured_images'
	);

	printf(
		'<div class="notice notice-info"><p>%1$s <a class="button button-primary" href="%2$s">%3$s</a></p></div>',
		esc_html__( 'Imported posts may have missing featured images. This repair checks attached media, the original export map, and existing upload files.', 'vanshea-creative-blog' ),
		esc_url( $url ),
		esc_html__( 'Repair featured images', 'vanshea-creative-blog' )
	);
}
add_action( 'admin_notices', 'vanshea_creative_blog_featured_image_admin_notice' );
