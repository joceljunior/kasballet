#!/bin/sh
# Garantir que PORT seja um número válido
if [ -z "$PORT" ]; then
  PORT=3000
fi

echo "Starting server on port ${PORT}"

# Usar formato host:port para o serve
npx serve -s dist -l 0.0.0.0:${PORT}
