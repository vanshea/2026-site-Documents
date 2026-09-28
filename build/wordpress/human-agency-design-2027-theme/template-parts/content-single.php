<article id="post-<?php the_ID(); ?>" <?php post_class( 'content-shell' ); ?>>
  <header class="entry-header"><p class="post-kicker"><?php the_category( ' / ' ); ?></p><?php the_title( '<h1 class="entry-title">', '</h1>' ); ?><p class="entry-meta"><?php had2027_posted_on(); ?><span aria-hidden="true"> · </span><?php had2027_posted_by(); ?></p>
    <?php if ( has_post_thumbnail() ) : ?><figure class="entry-featured-image"><?php the_post_thumbnail( 'full', array( 'decoding' => 'async' ) ); ?></figure><?php endif; ?>
  </header>
  <div class="entry-content"><?php the_content(); wp_link_pages( array( 'before' => '<nav class="page-links">' . esc_html__( 'Pages:', 'human-agency-design-2027' ), 'after' => '</nav>' ) ); ?></div>
  <footer class="entry-footer"><?php the_tags( '<span class="tags">', ', ', '</span>' ); ?></footer>
</article>
