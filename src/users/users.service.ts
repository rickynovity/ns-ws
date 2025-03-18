import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    // Check if the user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash the password
    let hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    createUserDto.password = hashedPassword;
    return this.prisma.user.create({
      data: {
        ...createUserDto,
      },
    });
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: id },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: userPassword, ...result } = user;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: updateUserDto,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: userPassword, ...result } = updatedUser;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.delete({ where: { id: user.id } });
  }

  async findByEmail(email: string) {
    try {
      const user = this.prisma.user.findFirst({
        where: { email },
      });
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
