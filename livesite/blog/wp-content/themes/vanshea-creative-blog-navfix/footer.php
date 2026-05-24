<?php
/**
 * Footer template.
 *
 * @package VanSheaCreativeBlog
 */
?>
</main>

<?php
$footer_text   = get_theme_mod( 'vsc_footer_text', __( 'Van Shea Sedita. All rights reserved.', 'vanshea-creative-blog' ) );
$default_theme = vanshea_creative_blog_get_default_theme();
$theme_choices = vanshea_creative_blog_theme_choices();
?>

<footer class="site-footer" id="siteFooter">
	<?php if ( get_theme_mod( 'vsc_show_footer_art', true ) ) : ?>
		<div class="site-footer-art" data-footer-kaleidoscope aria-hidden="true"></div>
	<?php endif; ?>
	<div class="site-footer-inner">
		<p>&copy; <span id="year"><?php echo esc_html( gmdate( 'Y' ) ); ?></span> <?php echo esc_html( $footer_text ); ?></p>
		<?php if ( get_theme_mod( 'vsc_show_theme_switcher', true ) ) : ?>
			<div class="theme-switcher" role="group" aria-label="<?php esc_attr_e( 'Choose site theme', 'vanshea-creative-blog' ); ?>">
				<?php foreach ( $theme_choices as $theme_slug => $theme_label ) : ?>
					<button
						class="theme-link<?php echo $theme_slug === $default_theme ? ' is-active' : ''; ?>"
						type="button"
						data-theme="<?php echo esc_attr( $theme_slug ); ?>"
						aria-pressed="<?php echo $theme_slug === $default_theme ? 'true' : 'false'; ?>"
					>
						<?php echo esc_html( $theme_label ); ?>
					</button>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
