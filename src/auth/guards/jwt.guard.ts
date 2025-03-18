import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST_USER_KEY } from '../auth.constants';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }
    const token = authorizationHeader.replace('Bearer ', '');
    console.log('TOKEN : ', token);

    try {
      await this.jwtService.verifyAsync(token, {
        secret: `${process.env.JWT_ACCESS_SECRET}`,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
    const payload = await this.jwtService.decode(token);
    console.log('PAYLOAD : ', payload);

    request[REQUEST_USER_KEY] = payload;

    return true;
  }
}
