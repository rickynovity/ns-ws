// Some code
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    let user = await this.userService.findByEmail(email);
    // User not found
    if (!user) {
      throw new BadRequestException('Wrong credentials');
    }
    // Compare password
    // const match = await bcrypt.compare(password, user.password);
    // if (!match) {
    //   throw new UnauthorizedException();
    // }
    // Remove password
    delete user.password;
    console.log('LOCAL STRATEGY : ', user);
    // Return the user
    return user;
  }

  async getUserConnected(id: string) {
    const connectedUser = await this.userService.findOne(id);
    if (!connectedUser) {
      throw new UnauthorizedException();
    }
    return connectedUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    const tokens = await this.generateTokens(user.email, user.id);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  // async hashData(data: string) {
  //   return await bcrypt.hash(data, await bcrypt.genSalt(10));
  // }
}
