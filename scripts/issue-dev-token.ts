import { JwtService } from '@nestjs/jwt';
import { jwtOptions } from '@shared/auth/jwt.options';
import { StockScope } from '@stock/adapters/http/stock.scopes';
import { loadEnvironment } from '@config/load-environment';

const DEFAULT_SUBJECT = 'dev-operator';
const DEFAULT_SCOPES = [StockScope.READ, StockScope.WRITE];

function main(): void {
  const [subject = DEFAULT_SUBJECT, ...scopes] = process.argv.slice(2);
  const environment = loadEnvironment();
  if (environment.NODE_ENV !== 'development') {
    throw new Error('Development tokens can only be issued with NODE_ENV=development');
  }
  const jwt = new JwtService(jwtOptions(environment));
  const scope = (scopes.length > 0 ? scopes : DEFAULT_SCOPES).join(' ');

  process.stdout.write(`${jwt.sign({ scope }, { subject })}\n`);
}

main();
