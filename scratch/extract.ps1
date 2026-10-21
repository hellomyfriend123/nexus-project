Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = "d:\FPTU\semester_6\OJT\srs-nexus-ecommerce-auction-v1.docx"
$outputPath = "d:\FPTU\semester_6\OJT\scratch_extracted_srs.txt"

$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlText = $reader.ReadToEnd()
$stream.Close()
$zip.Dispose()

[xml]$xml = $xmlText
$nsManager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsManager.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$paragraphs = $xml.SelectNodes("//w:p", $nsManager)
$lines = @()
foreach ($p in $paragraphs) {
    $texts = $p.SelectNodes(".//w:t", $nsManager)
    $line = ""
    foreach ($t in $texts) {
        $line += $t.InnerText
    }
    if ($line.Trim().Length -gt 0) {
        $lines += $line
    }
}

[System.IO.File]::WriteAllLines($outputPath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "Extraction complete. Total lines: " $lines.Count
