import { Role } from '../enum/role.enum';

export class User {
  constructor(
    public id: string,
    public name: string,
    public roles: Role[]
  ) {}
}
