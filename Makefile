# Funky Frame - Multi-language Start Commands
# Usage: make <target>

.PHONY: help start-perl start-js start-node start-python start-python2 start-ruby start-php start-go start-deno start-bun start-scala start-raku start-elixir start-rust start-swift start-lua start-tcl start-crystal start-nim start-haskell start-java start-kotlin start-groovy start-csharp start-fsharp start-powershell start-bash start-awk start install clean

# Default port (can be overridden: make start-python PORT=8080)
PORT ?= 8000

# Default target
help:
	@echo "Funky Frame - Available Commands:"
	@echo ""
	@echo "  make start-perl      Start server using Perl/Mojolicious (port 8000)"
	@echo "  make start-js        Start server using Node.js/serve (port 3000)"
	@echo "  make start-node      Alias for start-js"
	@echo "  make start-python    Start server using Python 3 (port $(PORT))"
	@echo "  make start-python2   Start server using Python 2 (port $(PORT))"
	@echo "  make start-ruby      Start server using Ruby/WEBrick (port $(PORT))"
	@echo "  make start-php       Start server using PHP built-in server (port $(PORT))"
	@echo "  make start-go        Start server using Go (port $(PORT))"
	@echo "  make start-deno      Start server using Deno (port $(PORT))"
	@echo "  make start-bun       Start server using Bun (port $(PORT))"
	@echo "  make start-scala     Start server using Scala/scala-cli (port $(PORT))"
	@echo "  make start-raku      Start server using Raku (port $(PORT))"
	@echo "  make start-elixir    Start server using Elixir (port $(PORT))"
	@echo "  make start-rust      Start server using Rust/miniserve (port $(PORT))"
	@echo "  make start-swift     Start server using Swift (port $(PORT))"
	@echo "  make start-lua       Start server using Lua (port $(PORT))"
	@echo "  make start-tcl       Start server using Tcl (port $(PORT))"
	@echo "  make start-crystal   Start server using Crystal (port $(PORT))"
	@echo "  make start-nim       Start server using Nim (port $(PORT))"
	@echo "  make start-haskell   Start server using Haskell/warp (port $(PORT))"
	@echo "  make start-java      Start server using Java (port $(PORT))"
	@echo "  make start-kotlin    Start server using Kotlin (port $(PORT))"
	@echo "  make start-groovy    Start server using Groovy (port $(PORT))"
	@echo "  make start-csharp    Start server using C#/.NET (port $(PORT))"
	@echo "  make start-fsharp    Start server using F#/.NET (port $(PORT))"
	@echo "  make start-powershell Start server using PowerShell (port $(PORT))"
	@echo "  make start-bash      Start server using Bash/netcat (port $(PORT))"
	@echo "  make start-awk       Start server using AWK (port $(PORT))"
	@echo "  make install         Install Node.js dependencies"
	@echo "  make start           Default start (uses Node.js)"
	@echo ""
	@echo "  Override port: make start-python PORT=9000"
	@echo ""

# Start with Perl (Mojolicious)
start-perl:
	@echo "Starting Funky Frame with Perl on http://0.0.0.0:8000"
	perl -Mojo -e 'a->static->paths->[0]=f;a->hook(before_dispatch=>sub{my$$c=shift;my$$p=$$c->req->url->path->to_string;$$p.="/"unless$$p=~/\.\w+$$/||$$p=~m|/$$|;$$p.="index.html"if$$p=~m|/$$|;$$c->req->url->path($$p)});a->start' daemon -l http://0.0.0.0:8000

# Start with Node.js (npm/serve)
start-js:
	@echo "Starting Funky Frame with Node.js on http://localhost:3000"
	npm run start

# Alias for start-js
start-node: start-js

# Start with Python 3
start-python:
	@echo "Starting Funky Frame with Python 3 on http://localhost:$(PORT)"
	python3 -m http.server $(PORT)

# Start with Python 2
start-python2:
	@echo "Starting Funky Frame with Python 2 on http://localhost:$(PORT)"
	python -m SimpleHTTPServer $(PORT)

# Start with Ruby (WEBrick)
start-ruby:
	@echo "Starting Funky Frame with Ruby on http://localhost:$(PORT)"
	ruby -run -ehttpd . -p$(PORT)

# Start with PHP built-in server
start-php:
	@echo "Starting Funky Frame with PHP on http://localhost:$(PORT)"
	php -S localhost:$(PORT)

# Start with Go (requires goexec or use go run with a simple server)
start-go:
	@echo "Starting Funky Frame with Go on http://localhost:$(PORT)"
	go run -e 'package main; import "net/http"; func main() { http.ListenAndServe(":$(PORT)", http.FileServer(http.Dir("."))) }' 2>/dev/null || \
	npx goexec 'http.ListenAndServe(":$(PORT)", http.FileServer(http.Dir(".")))'

# Start with Deno
start-deno:
	@echo "Starting Funky Frame with Deno on http://localhost:$(PORT)"
	deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts -p $(PORT)

# Start with Bun
start-bun:
	@echo "Starting Funky Frame with Bun on http://localhost:$(PORT)"
	bunx serve . -p $(PORT)

# Start with Scala (requires scala-cli)
start-scala:
	@echo "Starting Funky Frame with Scala on http://localhost:$(PORT)"
	scala-cli run -e 'import com.sun.net.httpserver._; import java.io._; import java.nio.file._; val s = HttpServer.create(new java.net.InetSocketAddress($(PORT)), 0); s.createContext("/", e => { val p = if (e.getRequestURI.getPath == "/") "/index.html" else e.getRequestURI.getPath; val f = new File("." + p); if (f.exists) { val b = Files.readAllBytes(f.toPath); e.sendResponseHeaders(200, b.length); e.getResponseBody.write(b); e.getResponseBody.close() } else { e.sendResponseHeaders(404, 0); e.getResponseBody.close() } }); s.start(); println("Serving on http://localhost:$(PORT)"); Thread.sleep(Long.MaxValue)'

# Start with Raku (formerly Perl 6)
start-raku:
	@echo "Starting Funky Frame with Raku on http://localhost:$(PORT)"
	raku -e 'use Cro::HTTP::Router; use Cro::HTTP::Server; my $$app = route { get -> *@path { static ".", @path } }; my $$server = Cro::HTTP::Server.new(:host<localhost>, :port($(PORT)), :application($$app)); $$server.start; react whenever signal(SIGINT) { $$server.stop; exit }' 2>/dev/null || \
	raku -MIO::Socket::INET -e 'my $$s = IO::Socket::INET.new(:listen, :localport($(PORT))); say "Serving on http://localhost:$(PORT)"; loop { my $$c = $$s.accept; my $$r = $$c.recv; my $$p = $$r.lines[0].words[1]; $$p = "/index.html" if $$p eq "/"; my $$f = ".$$p".IO; if $$f.e { $$c.print("HTTP/1.1 200 OK\r\n\r\n" ~ $$f.slurp) } else { $$c.print("HTTP/1.1 404 Not Found\r\n\r\n") }; $$c.close }'

# Start with Elixir
start-elixir:
	@echo "Starting Funky Frame with Elixir on http://localhost:$(PORT)"
	elixir -e ':inets.start(); :httpd.start([{:port, $(PORT)}, {:server_name, ~c"funky"}, {:server_root, ~c"."}, {:document_root, ~c"."}, {:directory_index, [~c"index.html"]}]); IO.puts("Serving on http://localhost:$(PORT)"); Process.sleep(:infinity)'

# Start with Rust (requires miniserve: cargo install miniserve)
start-rust:
	@echo "Starting Funky Frame with Rust/miniserve on http://localhost:$(PORT)"
	miniserve . -p $(PORT) --index index.html

# Start with Swift (macOS)
start-swift:
	@echo "Starting Funky Frame with Swift on http://localhost:$(PORT)"
	swift -e 'import Foundation; import Network; let listener = try! NWListener(using: .tcp, on: NWEndpoint.Port(integerLiteral: $(PORT))); print("Serving on http://localhost:$(PORT)"); listener.newConnectionHandler = { conn in conn.start(queue: .main) }; listener.start(queue: .main); RunLoop.main.run()' 2>/dev/null || \
	python3 -m http.server $(PORT)

# Start with Lua (requires lua-http or luasocket)
start-lua:
	@echo "Starting Funky Frame with Lua on http://localhost:$(PORT)"
	lua -e 'local http_server = require "http.server"; local http_headers = require "http.headers"; local s = http_server.listen{host="localhost",port=$(PORT),onstream=function(sv,st) local h=http_headers.new();h:append(":status","200");local p=st:get_headers():get":path";if p=="/" then p="/index.html" end;local f=io.open("."..p,"rb");if f then st:write_headers(h,false);st:write_body_from_file(f) end end};s:loop()' 2>/dev/null || \
	echo "Lua http server not available. Install lua-http: luarocks install http"

# Start with Tcl
start-tcl:
	@echo "Starting Funky Frame with Tcl on http://localhost:$(PORT)"
	tclsh <<< 'package require Tcl 8.6; socket -server {apply {{ch addr port} {gets $$ch line; set path [lindex [split $$line] 1]; if {$$path eq "/"} {set path "/index.html"}; if {[file exists ".$$path"]} {puts $$ch "HTTP/1.1 200 OK\r\n\r\n[read [open ".$$path"]]"} else {puts $$ch "HTTP/1.1 404 Not Found\r\n\r\n"}; close $$ch}}} $(PORT); puts "Serving on http://localhost:$(PORT)"; vwait forever'

# Start with Crystal (requires crystal)
start-crystal:
	@echo "Starting Funky Frame with Crystal on http://localhost:$(PORT)"
	crystal eval 'require "http/server"; server = HTTP::Server.new do |ctx| path = ctx.request.path == "/" ? "/index.html" : ctx.request.path; file = ".#{path}"; if File.exists?(file); ctx.response.content_type = "text/html"; ctx.response.print File.read(file); else; ctx.response.status = HTTP::Status.new(404); end; end; puts "Serving on http://localhost:$(PORT)"; server.listen("0.0.0.0", $(PORT))'

# Start with Nim (requires nimhttpd: nimble install nimhttpd)
start-nim:
	@echo "Starting Funky Frame with Nim on http://localhost:$(PORT)"
	nimhttpd -p:$(PORT) 2>/dev/null || \
	echo "Install nimhttpd: nimble install nimhttpd"

# Start with Haskell (requires warp: cabal install warp wai-app-static)
start-haskell:
	@echo "Starting Funky Frame with Haskell on http://localhost:$(PORT)"
	ghc -e 'import Network.Wai.Handler.Warp; import Network.Wai.Application.Static; import WaiAppStatic.Types; run $(PORT) (staticApp (defaultFileServerSettings "."))'  2>/dev/null || \
	stack exec -- warp -p $(PORT) 2>/dev/null || \
	echo "Install warp: cabal install warp wai-app-static"

# Start with Java (using jbang or built-in com.sun.net.httpserver)
start-java:
	@echo "Starting Funky Frame with Java on http://localhost:$(PORT)"
	java -e 'import com.sun.net.httpserver.*; import java.io.*; import java.nio.file.*; var s = HttpServer.create(new java.net.InetSocketAddress($(PORT)), 0); s.createContext("/", e -> { var p = e.getRequestURI().getPath(); if (p.equals("/")) p = "/index.html"; var f = new File("." + p); if (f.exists()) { var b = Files.readAllBytes(f.toPath()); e.sendResponseHeaders(200, b.length); e.getResponseBody().write(b); } else { e.sendResponseHeaders(404, 0); } e.getResponseBody().close(); }); s.start(); System.out.println("Serving on http://localhost:$(PORT)"); Thread.sleep(Long.MAX_VALUE);' 2>/dev/null || \
	jbang -c 'import com.sun.net.httpserver.*; import java.io.*; import java.nio.file.*; var s = HttpServer.create(new java.net.InetSocketAddress($(PORT)), 0); s.createContext("/", e -> { var p = e.getRequestURI().getPath(); if (p.equals("/")) p = "/index.html"; var f = new File("." + p); if (f.exists()) { var b = Files.readAllBytes(f.toPath()); e.sendResponseHeaders(200, b.length); e.getResponseBody().write(b); } else { e.sendResponseHeaders(404, 0); } e.getResponseBody().close(); }); s.start(); System.out.println("Serving on http://localhost:$(PORT)"); Thread.sleep(Long.MAX_VALUE);' 2>/dev/null || \
	python3 -m http.server $(PORT)

# Start with Kotlin (requires kotlin or kscript)
start-kotlin:
	@echo "Starting Funky Frame with Kotlin on http://localhost:$(PORT)"
	kotlin -e 'import com.sun.net.httpserver.*; import java.io.File; import java.nio.file.Files; val s = HttpServer.create(java.net.InetSocketAddress($(PORT)), 0); s.createContext("/") { e -> val p = if (e.requestURI.path == "/") "/index.html" else e.requestURI.path; val f = File("." + p); if (f.exists()) { val b = Files.readAllBytes(f.toPath()); e.sendResponseHeaders(200, b.size.toLong()); e.responseBody.write(b) } else { e.sendResponseHeaders(404, 0) }; e.responseBody.close() }; s.start(); println("Serving on http://localhost:$(PORT)"); Thread.sleep(Long.MAX_VALUE)' 2>/dev/null || \
	echo "Install Kotlin: brew install kotlin"

# Start with Groovy
start-groovy:
	@echo "Starting Funky Frame with Groovy on http://localhost:$(PORT)"
	groovy -e 'import com.sun.net.httpserver.*; def s = HttpServer.create(new InetSocketAddress($(PORT)), 0); s.createContext("/") { e -> def p = e.requestURI.path == "/" ? "/index.html" : e.requestURI.path; def f = new File("." + p); if (f.exists()) { def b = f.bytes; e.sendResponseHeaders(200, b.length); e.responseBody.write(b) } else { e.sendResponseHeaders(404, 0) }; e.responseBody.close() }; s.start(); println "Serving on http://localhost:$(PORT)"; Thread.sleep(Long.MAX_VALUE)'

# Start with C# / .NET (requires dotnet-serve: dotnet tool install -g dotnet-serve)
start-csharp:
	@echo "Starting Funky Frame with C#/.NET on http://localhost:$(PORT)"
	dotnet serve -p $(PORT) -d . 2>/dev/null || \
	echo "Install dotnet-serve: dotnet tool install -g dotnet-serve"

# Start with F# / .NET
start-fsharp:
	@echo "Starting Funky Frame with F#/.NET on http://localhost:$(PORT)"
	dotnet fsi --exec <<< 'open System.Net; open System.IO; let l = new HttpListener(); l.Prefixes.Add("http://localhost:$(PORT)/"); l.Start(); printfn "Serving on http://localhost:$(PORT)"; while true do let c = l.GetContext(); let p = if c.Request.Url.AbsolutePath = "/" then "/index.html" else c.Request.Url.AbsolutePath; let f = "." + p; if File.Exists(f) then let b = File.ReadAllBytes(f); c.Response.OutputStream.Write(b, 0, b.Length); c.Response.Close()' 2>/dev/null || \
	dotnet serve -p $(PORT) -d .

# Start with PowerShell
start-powershell:
	@echo "Starting Funky Frame with PowerShell on http://localhost:$(PORT)"
	pwsh -Command '$$l = New-Object Net.HttpListener; $$l.Prefixes.Add("http://localhost:$(PORT)/"); $$l.Start(); Write-Host "Serving on http://localhost:$(PORT)"; while ($$true) { $$c = $$l.GetContext(); $$p = if ($$c.Request.Url.AbsolutePath -eq "/") { "/index.html" } else { $$c.Request.Url.AbsolutePath }; $$f = "." + $$p; if (Test-Path $$f) { $$b = [IO.File]::ReadAllBytes($$f); $$c.Response.OutputStream.Write($$b, 0, $$b.Length) }; $$c.Response.Close() }'

# Start with Bash (using netcat - very basic)
start-bash:
	@echo "Starting Funky Frame with Bash on http://localhost:$(PORT)"
	@echo "Note: This is a very basic server, refresh may be needed"
	while true; do { echo -e "HTTP/1.1 200 OK\r\n"; cat index.html; } | nc -l $(PORT) -q 1 2>/dev/null || { echo -e "HTTP/1.1 200 OK\r\n"; cat index.html; } | nc -l $(PORT); done

# Start with AWK (yes, really)
start-awk:
	@echo "Starting Funky Frame with AWK on http://localhost:$(PORT)"
	@echo "Note: Single-request server, will exit after first request"
	awk 'BEGIN { s = "/inet/tcp/$(PORT)/0/0"; print "Serving on http://localhost:$(PORT)"; while ((s |& getline req) > 0) { if (req ~ /^GET/) { split(req, a); f = a[2] == "/" ? "./index.html" : "." a[2]; while ((getline line < f) > 0) content = content line "\n"; close(f); print "HTTP/1.1 200 OK\r" |& s; print "\r" |& s; print content |& s; close(s) } } }'

# Default start command
start: start-js

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	npm install
