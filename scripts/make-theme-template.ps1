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
  # ... also when they are served from a custom domain (assets.your-domain.com, assets.<sub>.your-domain.com)
  @('https?://assets\.(?:[a-z0-9-]+\.)*(?:groupchaton|shareyourgroup)\.com/', 'https://YOUR-GITHUB-USER.github.io/YOUR-REPO/'),
  # analytics and ads
  @('\bG-[A-Z0-9]{8,12}\b', 'G-XXXXXXXXXX'),
  @('ca-pub-\d{10,}', 'ca-pub-0000000000000000'),
  @("data-ad-slot='\d+'", "data-ad-slot='0000000000'"),
  @("adSlot: '[^']*'", "adSlot: ''"),
  @("<meta content='[^']*' name='(google-site-verification|msvalidate\.01|p:domain_verify|facebook-domain-verification)'/>", '<meta content=''YOUR-CODE'' name=''$1''/>'),
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
  # sponsored cards hold your referral links: the template gets one sample card
  @("(?s)(<b:widget id='HTML987'.*?<!\[CDATA\[).*?(\]\]>)", '$1<div><b class="promo-title">Your offer</b><span class="promo-line">One line about it.</span><a class="cta-btn" href="https://example.com/" rel="sponsored noopener" target="_blank">Learn more</a></div>$2'),
  # your own domain
  @('https?://(?:www\.)?groupchaton\.com', 'https://www.your-domain.com'),
  @('https?://([a-z0-9-]+)\.groupchaton\.com', 'https://$1.your-domain.com'),
  # links to the owner's other sites
  @('https?://(?:www\.)?shareyourgroup\.com', 'https://www.example.com'),
  @('https?://([a-z0-9-]+)\.shareyourgroup\.com', 'https://$1.example.com'),
  # the same addresses written as plain text (no https://)
  @('(?i)\b((?:[a-z0-9-]+\.)*)groupchaton\.com\b', '${1}your-domain.com'),
  @('(?i)\b((?:[a-z0-9-]+\.)*)shareyourgroup\.com\b', '${1}example.com'),
  # campaign tags on sponsor links
  @('\?source=[a-z0-9]+(&amp;|&)innerpage=main', '')
)
# The footer credit ("Designed & Developed by Nivesh Sahayak") is kept as it is: see LICENSE.
foreach ($r in $rules) { $xml = [regex]::Replace($xml, $r[0], $r[1]) }

# personal ids used inside pages (PayPal, Ko-fi ...): every value is emptied, whatever keys are there
$xml = [regex]::Replace($xml, 'ids:\s*\{[^}]*\}', { param($m) [regex]::Replace($m.Value, "'[^']*'", "''") })

# Safety net: if anything personal is still in the text, stop and write NOTHING.
# (Add a rule above for whatever is reported, then run the script again.)
$mustNotRemain = @(
  @('AdSense publisher id',      'ca-pub-(?!0{16}\b)\d+'),
  @('AdSense ad unit id',        "data-ad-slot='(?!0+')[^']*'|adSlot: '[^']+'|\b(?:top|inArticle|end|rail|multiplex|home): '\d+'"),
  @('Analytics id',              '\bG-(?!X{10}\b)[A-Z0-9]{8,12}\b'),
  @('your own domains',          '(?i)(?:groupchaton|shareyourgroup)\.com|[a-z0-9-]+\.github\.io/(?!YOUR-REPO/)'),
  @('Apps Script web app',       'script\.google\.com/macros/s/(?!YOUR-APPS-SCRIPT-ID/)'),
  @('personal ids (ids: {...})', "ids:\s*\{[^}]*:\s*'[^']+'"),
  @('PayPal id',                 "(?i)paypal\w*['""]?\s*[:=]\s*['""][^'""]+['""]"),
  @('Ko-fi page',                '(?i)ko-fi\.com/(?!YOUR-NAME)'),
  @('Disqus / TinyURL key',      "(?:disqus|tinyurlKey): '[^']+'"),
  @('verification code',         "<meta content='(?!YOUR-)[^']*' name='[^']*verif[^']*'/>"),
  @('social profile',            '(?i)(?:instagram\.com|facebook\.com|x\.com|reddit\.com/user)/(?!YOUR-|sharer)[A-Za-z0-9_.-]+|whatsapp\.com/channel/(?!YOUR-)[A-Za-z0-9]+|youtube\.com/@(?!YOUR-)'),
  @('sponsor / referral link',   '(?i)blogger\.googleusercontent\.com|/referral/|[?&](?:amp;)?(?:ref|source|utm_[a-z]+)=')
)
$found = @()
foreach ($c in $mustNotRemain) {
  foreach ($m in [regex]::Matches($xml, $c[1])) {
    $line = ($xml.Substring(0, $m.Index) -split "`n").Count
    $found += "  line $line  $($c[0]):  $($m.Value)"
  }
}
if ($found.Count) {
  Write-Host "STOPPED: personal values are still in the text, so blogger/theme.template.xml was NOT changed:" -ForegroundColor Red
  $found | Select-Object -Unique | ForEach-Object { Write-Host $_ }
  exit 1
}

$head = "<?xml version=`"1.0`" encoding=`"UTF-8`" ?>"
$xml = $xml -replace '^\s*<\?xml[^>]*\?>', $head
[IO.File]::WriteAllText("$root\blogger\theme.template.xml", $xml, $utf8)
"blogger/theme.template.xml written ($([math]::Round($xml.Length / 1kb)) KB)"
