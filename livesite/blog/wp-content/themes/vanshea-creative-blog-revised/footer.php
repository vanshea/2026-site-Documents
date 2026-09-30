<?php
/**
 * Footer template.
 *
 * @package VanSheaCreativeBlog
 */
?>
</main>

<?php
$footer_text   = get_theme_mod( 'vsc_footer_text', __( 'Van Shea Sedita · Van Shea Creative · Human Agency Design', 'vanshea-creative-blog' ) );
$default_theme = vanshea_creative_blog_get_default_theme();
$theme_choices = vanshea_creative_blog_theme_choices();
?>

<div class="footer-wave" data-footer-wave>
	<svg viewBox="0 -50 1440 250" preserveAspectRatio="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
		<path stroke="#f36070" d="M-80 70 C150 132 330 46 550 82 S925 143 1130 92 S1420 50 1520 88 L1520 250 L-80 250 Z" />
		<path stroke="#cfbead" d="M-80 84 C165 145 325 56 550 95 S930 153 1130 105 S1410 64 1520 100" />
		<path stroke="#b6d800" d="M-80 98 C150 157 330 68 550 107 S930 164 1130 117 S1420 75 1520 112" />
		<path stroke="#55b9d0" d="M-80 112 C160 170 330 81 550 120 S930 175 1130 130 S1420 89 1520 124" />
		<path stroke="#b5a0db" d="M-80 126 C155 183 325 94 550 133 S930 187 1130 143 S1410 102 1520 138" />
	</svg>
	<button class="footer-wave-toggle" type="button" aria-label="<?php esc_attr_e( 'Pause footer wave animation', 'vanshea-creative-blog' ); ?>" aria-pressed="true">
		<?php esc_html_e( 'Pause wave', 'vanshea-creative-blog' ); ?>
	</button>
</div>

<footer class="home-footer" id="siteFooter">
	<?php if ( get_theme_mod( 'vsc_show_theme_switcher', true ) ) : ?>
		<div class="footer-container view-controls">
			<fieldset class="theme-control">
				<legend><?php esc_html_e( 'Color theme', 'vanshea-creative-blog' ); ?></legend>
				<?php foreach ( $theme_choices as $theme_slug => $theme_label ) : ?>
					<label>
						<input
							type="radio"
							name="color-theme"
							value="<?php echo esc_attr( $theme_slug ); ?>"
							<?php checked( $theme_slug, $default_theme ); ?>
						>
						<span><?php echo esc_html( $theme_label ); ?></span>
					</label>
				<?php endforeach; ?>
			</fieldset>
		</div>
	<?php endif; ?>
	<div class="footer-container footer-inner">
		<p>&copy; <span id="year"><?php echo esc_html( gmdate( 'Y' ) ); ?></span> <?php echo esc_html( $footer_text ); ?></p>
		<nav class="footer-links" aria-label="<?php esc_attr_e( 'Footer navigation', 'vanshea-creative-blog' ); ?>">
			<a href="https://www.vanshea.com/experience.html"><?php esc_html_e( 'Experience', 'vanshea-creative-blog' ); ?></a>
			<a href="https://www.vanshea.com/work.html"><?php esc_html_e( 'Work', 'vanshea-creative-blog' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Blog', 'vanshea-creative-blog' ); ?></a>
			<a href="https://www.linkedin.com/in/vanshea/" target="_blank" rel="noopener noreferrer">
				<?php esc_html_e( 'LinkedIn', 'vanshea-creative-blog' ); ?><span class="screen-reader-text"> <?php esc_html_e( '(opens in a new tab)', 'vanshea-creative-blog' ); ?></span>
			</a>
		</nav>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
