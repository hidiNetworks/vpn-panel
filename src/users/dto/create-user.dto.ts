import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The username of the user',
    minimum: 4,
    example: 'john.doe',
  })
  @IsString()
  @MinLength(4)
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    minimum: 6,
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
