import { Injectable } from '@nestjs/common';

export type User = {
  id: number;
  username: string;
  password: string;
  roles: string[];
};

@Injectable()
export class UserService {
  private readonly users: User[] = [
    {
      id: 1,
      username: 'user_admin',
      password: 'hashed_password',
      roles: ['admin'],
    },
    {
      id: 2,
      username: 'user_user',
      password: 'hashed_password',
      roles: ['user'],
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}
