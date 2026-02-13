# Emergency Authentication Plugin Fix

You are seeing `rest_no_route` because WordPress has not loaded the plugin code. This is usually because the file is in a subfolder but not activated properly, or there's a PHP error preventing it from loading.

**Follow these exact steps to fix it permanently:**

## Step 1: Delete Old Plugin

1.  Open your **File Manager** (cPanel or FTP).
2.  Go to `wp-content/plugins/`.
3.  **Delete** the folder or file named `myqugen-auth` or whatever you named the previous attempt.

## Step 2: Create ONE Simple File

1.  In `wp-content/plugins/`, create a **new file** named `simple-auth.php`.
2.  **Copy and paste ONLY this code** into `simple-auth.php`:

```php
<?php
/**
 * Plugin Name: Simple Auth for MyQugen
 * Description: Basic email check for login.
 * Version: 2.0
 */

// Prevent direct file access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'myqugen/v1', '/auth', array(
        'methods'  => 'POST',
        'callback' => 'myqugen_check_email',
        'permission_callback' => '__return_true',
    ) );
} );

function myqugen_check_email( $request ) {
    $params = $request->get_json_params();
    $email = isset( $params['email'] ) ? sanitize_email( $params['email'] ) : '';

    if ( empty( $email ) ) {
        return new WP_Error( 'missing_email', 'Email is required', array( 'status' => 400 ) );
    }

    $user = get_user_by( 'email', $email );

    if ( $user ) {
        return array(
            'success' => true,
            'user_id' => $user->ID,
            'user_display_name' => $user->display_name,
            'message' => 'User found',
        );
    } else {
        return new WP_Error( 'user_not_found', 'No user found with this email', array( 'status' => 404 ) );
    }
}
```

## Step 3: Activate & Flush (Do not skip!)

1.  Go to **WordPress Admin > Plugins**.
2.  Find **"Simple Auth for MyQugen"** and click **Activate**.
3.  Go to **Settings > Permalinks**.
4.  Click the **Save Changes** button at the bottom.

## Step 4: Verify

1.  Open this link in your browser:  
    `https://ahsan.ronybormon.com/wp-json/myqugen/v1/auth`
2.  You should see: `{"code":"rest_missing_callback_param"}` or similar JSON.
    *   If you see `rest_no_route`, repeat Step 3.

Once Step 4 works, your login page will work immediately.
