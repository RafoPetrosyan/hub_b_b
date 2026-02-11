import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { User } from '../../modules/business/modules/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../modules/auth';
import { UserStatusEnum } from '../../modules/business/modules/user/enum/user-status.enum';

export default class SuperAdminSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const superAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

    // Check if super admin already exists
    const existingSuperAdmin = await userRepository.findOne({
      where: { email: superAdminEmail },
    });

    if (existingSuperAdmin) {
      console.log(
        `Super admin user with email ${superAdminEmail} already exists. Skipping seed.`,
      );
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);

    const superAdmin = userRepository.create({
      first_name: superAdminFirstName,
      last_name: superAdminLastName,
      email: superAdminEmail,
      password_hash: hashedPassword,
      status: UserStatusEnum.ACTIVE,
      role: UserRole.SUPER_ADMIN,
    });

    await userRepository.save(superAdmin);
    console.log('Super admin user created successfully!');
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log(
      '⚠️  Please change the default password after first login for security!',
    );
  }
}
