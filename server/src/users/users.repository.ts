import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../db/database.constants';
import type { Database } from '../db/database.types';
import { type NewUser, users } from '../db/schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(user: NewUser): Promise<void> {
    await this.db.insert(users).values(user);
  }
}
