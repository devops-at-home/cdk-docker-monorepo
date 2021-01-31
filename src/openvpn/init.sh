#!/usr/bin/env sh

# Create resources required by VPN
mkdir -p /run/openvpn
mkdir -p /dev/net
mknod /dev/net/tun c 10 200

# Connect to VPN
exec /usr/sbin/openvpn \
  --writepid /run/openvpn/server.pid \
  --cd /vpn \
  --config /vpn/client.conf \
  --script-security 2
