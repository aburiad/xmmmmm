<?php
/**
 * Plugin Update Helper
 * Upload this file to your WordPress root to help update/verify the plugin
 */

// Load WordPress
require_once('wp-load.php');

// Check if plugin is active
$plugin_slug = 'question-paper-pdf-generator/question-paper-pdf-generator.php';
$is_active = is_plugin_active($plugin_slug);

?>
<!DOCTYPE html>
<html>
<head>
    <title>Plugin Update & Verification</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .success { color: green; padding: 10px; background: #d4edda; margin: 10px 0; border-radius: 4px; }
        .error { color: red; padding: 10px; background: #f8d7da; margin: 10px 0; border-radius: 4px; }
        .info { color: #0c5460; padding: 10px; background: #d1ecf1; margin: 10px 0; border-radius: 4px; }
        .warning { color: #856404; padding: 10px; background: #fff3cd; margin: 10px 0; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Plugin Update & Verification</h1>
        
        <?php if ($is_active): ?>
            <div class="success">✅ Plugin is ACTIVE!</div>
        <?php else: ?>
            <div class="error">❌ Plugin is NOT ACTIVE - Please activate it first</div>
        <?php endif; ?>
        
        <h2>Next Steps:</h2>
        
        <h3>Step 1: Update the Plugin Files</h3>
        <div class="info">
            Upload/update these files via FTP or File Manager:
            <pre>/wp-content/plugins/question-paper-pdf-generator/
├── question-paper-pdf-generator.php (MAIN FILE)
├── includes/
│   ├── class-qp-rest-api.php (UPDATED - Fixed route registration)
│   ├── class-qp-post-type.php
│   ├── class-qp-pdf-generator.php
│   └── lib/fpdf.php
└── fonts/
    ├── courier.php
    ├── helvetica.php
    ├── helveticab.php
    └── helveticai.php</pre>
        </div>
        
        <h3>Step 2: Verify Plugin</h3>
        <div class="warning">
            After uploading files, visit:
            <pre>https://ahsan.ronybormon.com/wp-admin/plugins.php</pre>
            The plugin should still show as "Active"
        </div>
        
        <h3>Step 3: Flush Rewrite Rules</h3>
        <div class="info">
            Go to WordPress Admin:
            <pre>Settings → Permalinks → Save Changes</pre>
            This refreshes the REST API route registration.
        </div>
        
        <h3>Step 4: Test the API</h3>
        <div class="info">
            Copy this into browser console (F12):
            <pre>fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(d => console.log('✅ SUCCESS:', d))
  .catch(e => console.error('❌ ERROR:', e));</pre>
        </div>
        
        <h3>Step 5: Test React App</h3>
        <div class="info">
            <ol>
                <li>Go back to React app</li>
                <li>Create/save a paper</li>
                <li>Check browser console for success message</li>
                <li>Check WordPress Admin → Posts → Question Papers</li>
            </ol>
        </div>
        
        <h2>Current Status</h2>
        <div class="info">
            <strong>Plugin Status:</strong> <?php echo $is_active ? '✅ ACTIVE' : '❌ NOT ACTIVE'; ?><br>
            <strong>WordPress Version:</strong> <?php bloginfo('version'); ?><br>
            <strong>PHP Version:</strong> <?php echo phpversion(); ?><br>
            <strong>Site URL:</strong> <?php echo home_url(); ?>
        </div>
        
        <h2>What Was Fixed</h2>
        <div class="success">
            ✅ REST API route registration corrected
            <pre>- Multiple registrations of same route removed
- GET/POST on /papers combined properly
- GET/PUT/DELETE on /papers/{id} combined properly
- Data parameter fixed (React sends 'data', not 'questionPaper')</pre>
        </div>
        
        <h2>File Upload Method</h2>
        <div class="warning">
            <strong>Via FTP/SFTP:</strong>
            <pre>Server: ahsan.ronybormon.com
Username: [your FTP user]
Password: [your FTP password]
Port: 21 (FTP) or 22 (SFTP)

Navigate to: /wp-content/plugins/
Upload folder: question-paper-pdf-generator/
Overwrite existing files</pre>
        </div>
        
        <h2>Troubleshooting</h2>
        <div class="info">
            <p><strong>If still getting 404:</strong></p>
            <ol>
                <li>Check files uploaded correctly</li>
                <li>Verify plugin is active (should show "Deactivate" button)</li>
                <li>Go to Settings → Permalinks → Save Changes (flush rewrite rules)</li>
                <li>Clear browser cache (Ctrl+Shift+Delete)</li>
                <li>Refresh React app (Ctrl+F5)</li>
                <li>Try saving a paper again</li>
            </ol>
        </div>
    </div>
</body>
</html>
