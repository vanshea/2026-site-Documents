<?php
/**
 * Footer template.
 *
 * @package VanSheaCreativeBlog
 */
?>
</main>

<footer class="site-footer">
	<div class="site-footer-inner">
		<p>&copy; <span id="year"><?php echo esc_html( gmdate( 'Y' ) ); ?></span> Van Shea Sedita. <?php esc_html_e( 'All rights reserved.', 'vanshea-creative-blog' ); ?></p>
		<div class="theme-switcher" role="group" aria-label="<?php esc_attr_e( 'Choose site theme', 'vanshea-creative-blog' ); ?>">
			<button class="theme-link" type="button" data-theme="theme2" aria-pressed="true">
				<span class="sr-only"><?php esc_html_e( 'Warm theme', 'vanshea-creative-blog' ); ?></span>
			</button>
			<button class="theme-link" type="button" data-theme="theme-dark" aria-pressed="false">
				<span class="sr-only"><?php esc_html_e( 'Dark theme', 'vanshea-creative-blog' ); ?></span>
			</button>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
