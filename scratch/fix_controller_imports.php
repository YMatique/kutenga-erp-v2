<?php

$baseDir = __DIR__ . '/../app/Http/Controllers/';
$domains = ['Inventory', 'Billing', 'Catalog', 'Pos'];

foreach ($domains as $domain) {
    $dir = $baseDir . $domain;
    if (!is_dir($dir)) continue;
    
    $files = new DirectoryIterator($dir);
    foreach ($files as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $path = $file->getRealPath();
            $content = file_get_contents($path);
            
            // Check if it extends Controller but doesn't import it
            if (preg_match('/\bextends\s+Controller\b/', $content)) {
                if (!preg_match('/use\s+App\\\\Http\\\\Controllers\\\\Controller;/', $content)) {
                    // Inject use App\Http\Controllers\Controller; after the namespace declaration
                    $content = preg_replace(
                        '/(namespace\s+[^;]+;)/', 
                        "$1\n\nuse App\\Http\\Controllers\\Controller;", 
                        $content, 
                        1
                    );
                    file_put_contents($path, $content);
                    echo "Fixed Controller import in $path\n";
                }
            }
        }
    }
}
