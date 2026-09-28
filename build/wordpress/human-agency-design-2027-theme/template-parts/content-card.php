<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
  <a class="post-card-link" href="<?php the_permalink(); ?>">
    <span class="post-card-media"><?php if ( ! had2027_post_image( 'large', 'post-card-image' ) ) : ?><span class="post-card-placeholder" aria-hidden="true"><?php echo esc_html( mb_substr( wp_strip_all_tags( get_the_title() ), 0, 1 ) ); ?></span><?php endif; ?></span>
    <div class="post-card-copy"><p class="post-card-meta"><?php had2027_posted_on(); ?><?php if ( get_the_category() ) : ?><span aria-hidden="true"> · </span><?php the_category( ', ' ); endif; ?></p>
    <h2><?php the_title(); ?></h2><p class="post-card-excerpt"><?php echo esc_html( get_the_excerpt() ); ?></p><span class="read-link"><?php esc_html_e( 'Read article', 'human-agency-design-2027' ); ?> <span aria-hidden="true">→</span></span></div>
  </a>
</article>
