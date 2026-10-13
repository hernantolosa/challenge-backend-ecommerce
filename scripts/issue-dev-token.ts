import { JwtService } from '@nestjs/jwt';
import { jwtOptions } from '../src/auth/auth.module';
import { Scope } from '../src/auth/scope';
import { loadEnvironment } from '../src/config/environment';

const DEFAULT_SUBJECT = 'dev-operator';
const DEFAULT_SCOPES = [Scope.STOCK_READ, Scope.STOCK_WRITE];

function main(): void {
  const [subject = DEFAULT_SUBJECT, ...scopes] = process.argv.slice(2);
  const jwt = new JwtService(jwtOptions(loadEnvironment()));
  const scope = (scopes.length > 0 ? scopes : DEFAULT_SCOPES).join(' ');

  process.stdout.write(`${jwt.sign({ scope }, { subject })}\n`);
}

main();
