import { JwtService } from '@nestjs/jwt';
import { jwtOptions } from '../src/infrastructure/auth/options/jwt.options';
import { Scope } from '../src/infrastructure/auth/enums/scope';
import { loadEnvironment } from '../src/infrastructure/config/loaders/load-environment';

const DEFAULT_SUBJECT = 'dev-operator';
const DEFAULT_SCOPES = [Scope.STOCK_READ, Scope.STOCK_WRITE];

function main(): void {
  const [subject = DEFAULT_SUBJECT, ...scopes] = process.argv.slice(2);
  const jwt = new JwtService(jwtOptions(loadEnvironment()));
  const scope = (scopes.length > 0 ? scopes : DEFAULT_SCOPES).join(' ');

  process.stdout.write(`${jwt.sign({ scope }, { subject })}\n`);
}

main();
