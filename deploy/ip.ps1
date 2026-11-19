# Печатает локальный IPv4-адрес этого компьютера в домашней сети (для start.bat).
$c = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
if ($c) { $c.IPv4Address.IPAddress }
