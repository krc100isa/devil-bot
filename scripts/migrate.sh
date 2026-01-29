#!/usr/bin/env bash
set -euo pipefail

npm --workspace @securechat/auth-service run prisma:migrate
npm --workspace @securechat/message-service run prisma:migrate
