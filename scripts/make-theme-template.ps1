# Makes blogger/theme.template.xml (public) from your own blogger/theme.xml (kept private, see .gitignore).
# Every site-specific value is swapped for a placeholder, so the template can be shared safely.
# Run it after you change theme.xml:   powershell -ExecutionPolicy Bypass -File scripts\make-theme-template.ps1
# Designed & Developed by Nivesh Sahayak (https://www.niveshsahayak.in/). All rights reserved: see LICENSE.
$root = Split-Path $PSScriptRoot -Parent
$utf8 = New-Object Text.UTF8Encoding($false)
$xml = [IO.File]::ReadAllText("$root\blogger\theme.xml", $utf8)

$rules = @(
  # where gco.css / gco.js / the chapter lists are served from
  @('https://[a-z0-9-]+\.github\.io/[A-Za-z0-9_.-]+/', 'https://YOUR-GITHUB-USER.github.io/YOUR-REPO/'),
  # analytics and ads
  @('\bG-[A-Z0-9]{8,12}\b', 'G-XXXXXXXXXX'),
  @('ca-pub-\d{10,}', 'ca-pub-0000000000000000'),
  @("(top|inArticle|end|rail|multiplex|home): '\d+'", '$1: '''''),
  @("disqus: '[^']*'", "disqus: ''"),
  @("tinyurlKey: '[^']*'", "tinyurlKey: ''"),
  # social profiles and support links
  @('https://www\.instagram\.com/[^''"/\s]+/?', 'https://www.instagram.com/YOUR-PAGE'),
  @('https://www\.facebook\.com/[^''"/\s]+/?', 'https://www.facebook.com/YOUR-PAGE'),
  @('https://www\.x\.com/[^''"/\s]+/?', 'https://www.x.com/YOUR-NAME'),
  @('https://(www\.)?whatsapp\.com/channel/[A-Za-z0-9]+', 'https://whatsapp.com/channel/YOUR-CHANNEL'),
  @('https://www\.youtube\.com/@[^''"/\s]+', 'https://www.youtube.com/@YOUR-CHANNEL'),
  @('https://ko-fi\.com/[^''"/\s]+', 'https://ko-fi.com/YOUR-NAME'),
  @('https://www\.trustpilot\.com/review/[^''"/\s]+', 'https://www.trustpilot.com/review/your-domain.com'),
  # your own domain
  @('https?://(?:www\.)?groupchaton\.com', 'https://www.your-domain.com')
)
# The footer credit ("Designed & Developed by Nivesh Sahayak") is kept as it is: see LICENSE.
foreach ($r in $rules) { $xml = [regex]::Replace($xml, $r[0], $r[1]) }

$head = "<?xml version=`"1.0`" encoding=`"UTF-8`" ?>"
$xml = $xml -replace '^\s*<\?xml[^>]*\?>', $head
[IO.File]::WriteAllText("$root\blogger\theme.template.xml", $xml, $utf8)
"blogger/theme.template.xml written ($([math]::Round($xml.Length / 1kb)) KB)"
