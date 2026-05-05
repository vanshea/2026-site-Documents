# WordPress Blog Upload Notes

Upload the contents of this folder to the site's `/blog` directory.

Before uploading, edit `wp-config.php` and replace:

- `siteground_database_name_here`
- `siteground_database_user_here`
- `siteground_database_password_here`
- `localhost`, only if SiteGround gives you a different database host

The table prefix is set to `wp_icjz_` because the provided SQL file contains
the `wp_icjz_options` table.

Best restore path from the reviewed migration folder:

1. Upload this folder to `/blog`.
2. Edit `wp-config.php` with the SiteGround database values.
3. Visit `/blog/wp-admin/install.php` and create the initial WordPress admin.
4. In WordPress admin, install the official WordPress Importer.
5. Import `wp-content/imports/vansheasedita.WordPress.2024-10-15-for-blog.xml`.
6. Assign imported posts to your new admin user.
7. Enable "Download and import file attachments" during import if WordPress asks.
8. Activate the `Twenty Twenty-One Child` theme if you want the old theme.

The October 15, 2024 XML export is the best content source found in
`/Users/vansedita/Documents/Website Switch 2024`. It contains posts, pages,
attachments, menus, and several WordPress style/template records.

I also copied the old `wp-content/uploads` and several old themes into this
package. The media copy was partial because the source copy stalled locally:
626 of 1,177 upload files copied. The XML importer may still be able to fetch
missing media from the old live URLs if they remain reachable.

`wp_icjz_options-for-blog.sql` is included, but treat it as optional and
secondary. Importing the XML through WordPress admin is safer than importing
only the old options table.

Important: the provided SQL file is not a full WordPress database export. It
only contains the options table, so it does not include posts, pages, users,
themes, plugins, media library records, comments, categories, or menus. A full
migration needs the rest of the `wp_icjz_*` tables and the `wp-content/uploads`
files from the old site.
