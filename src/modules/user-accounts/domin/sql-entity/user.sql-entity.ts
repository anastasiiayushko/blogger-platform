type PrimitiveType = {
  id: string | null;
  login: string;
  email: string;
  password: string;
  createdAt: Date | null;
};

export class User {
  private constructor(
    /** null указывает на то что это ново созданная запись
     * значение атрибута устанавливается при создании строки
     * */
    public readonly id: string | null,
    public readonly email: string,
    public readonly login: string,
    public readonly password: string,
    /** null указывает на то что это ново созданная запись,
     * значение атрибута устанавливается при создании строки*/
    public readonly createdAt: Date | null,
  ) {}

  static createInstance(email: string, login: string, password: string): User {
    return new User(null, email, login, password, null);
  }

  /** Для маппера */

  static toDomain(row: {
    id: string;
    email: string;
    login: string;
    password: string;
    createdAt: Date;
  }): User {
    return new User(row.id, row.email, row.login, row.password, row.createdAt);
  }

  static toPrimitive(user: User): PrimitiveType {
    return {
      id: user.id,
      email: user.email,
      login: user.login,
      password: user.password,
      createdAt: user.createdAt,
    };
  }
}
