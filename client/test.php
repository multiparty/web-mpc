<html>
<head>
	<title>test</title>
</head>
<body>
<?php
	// file to test post request
	$file = fopen("test.txt", "w+");
	fwrite($file, json_encode($_POST, JSON_PRETTY_PRINT));

?>
</body>
</html>