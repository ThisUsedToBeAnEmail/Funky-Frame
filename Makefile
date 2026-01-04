# Funky Frame - Multi-language Start Commands
# Usage: make <target>

.PHONY: help start-perl start-js start-node start-python start-ruby start-php start-deno start-bun start-rust start-csharp start install clean

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
	@echo "  make start-ruby      Start server using Ruby/WEBrick (port $(PORT))"
	@echo "  make start-php       Start server using PHP built-in server (port $(PORT))"
	@echo "  make start-deno      Start server using Deno (port $(PORT))"
	@echo "  make start-bun       Start server using Bun (port $(PORT))"
	@echo "  make start-rust      Start server using Rust/miniserve (port $(PORT))"
	@echo "  make start-csharp    Start server using C#/.NET (port $(PORT))"
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

# Start with Ruby (WEBrick)
start-ruby:
	@echo "Starting Funky Frame with Ruby on http://localhost:$(PORT)"
	ruby -run -ehttpd . -p$(PORT)

# Start with PHP built-in server
start-php:
	@echo "Starting Funky Frame with PHP on http://localhost:$(PORT)"
	php -S localhost:$(PORT)

# Start with Deno
start-deno:
	@echo "Starting Funky Frame with Deno on http://localhost:$(PORT)"
	deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts -p $(PORT)

# Start with Bun
start-bun:
	@echo "Starting Funky Frame with Bun on http://localhost:$(PORT)"
	bunx serve . -p $(PORT)

# Start with Rust (requires miniserve: cargo install miniserve)
start-rust:
	@echo "Starting Funky Frame with Rust/miniserve on http://localhost:$(PORT)"
	miniserve . -p $(PORT) --index index.html

# Start with C# / .NET (requires dotnet-serve: dotnet tool install -g dotnet-serve)
start-csharp:
	@echo "Starting Funky Frame with C#/.NET on http://localhost:$(PORT)"
	dotnet serve -p $(PORT) -d . 2>/dev/null || \
	echo "Install dotnet-serve: dotnet tool install -g dotnet-serve"

# Default start command
start: start-js

# Install dependencies
install:
	@echo "Installing Node.js dependencies..."
	npm install
