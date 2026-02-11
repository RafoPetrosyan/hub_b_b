import { DataSource, QueryDeepPartialEntity } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { NotificationVariable } from '../../modules/business/modules/notification-template/entities/notification-variable.entity';
import { NotificationType } from '../../modules/business/modules/notification-template/entities/notification-type.entity';

export class NotificationTemplateVariables1767006083930 implements Seeder {
    track = false;

    public async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<any> {
      console.log('[Seeder] NotificationTemplateVariablesSeeder running');

      const variableRepo = dataSource.getRepository(NotificationVariable);
      const typeRepo = dataSource.getRepository(NotificationType);

      const existingKeys = new Set(
        (await variableRepo.find({ select: ['key'] })).map(v => v.key),
      );

      const types = await typeRepo.find();
      const typeMap = new Map(types.map(t => [t.key, t]));

      const payload = [
        {
          key: 'client_name',
          label: 'Client Name',
          description: 'The client name who is related to the action',
          typeKeys: ['user_schedule_reminder', 'user_welcome'],
        },
        {
          key: 'company_name',
          label: 'Company Name',
          description: 'The company name which is related to the action',
          typeKeys: [
            'user_schedule_reminder',
            'company_2fa',
            'company_welcome',
            'company_code_verification',
          ],
        },
        {
          key: 'company_address',
          label: 'Company Address',
          description: 'The company address in human readable format',
          typeKeys: ['user_schedule_reminder'],
        },
        {
          key: 'reservation_date',
          label: 'Reservation Date',
          description: 'The date of the client reservation',
          typeKeys: ['user_schedule_reminder'],
        },
        {
          key: 'verification_code',
          label: 'Verification Code',
          description: 'The verification code which will be sent to company',
          typeKeys: ['company_code_verification', 'company_2fa'],
        },
      ].filter(v => !existingKeys.has(v.key));

      if (!payload.length) {
        console.log('[Seeder] nothing to insert');
        return;
      }

      const savedVariables = await variableRepo.save(
        payload.map(v => ({
          key: v.key,
          label: v.label,
          description: v.description,
          required: false,
        })),
      );

      for (const variable of savedVariables) {
        const source = payload.find(p => p.key === variable.key)!;

        variable.types = source.typeKeys
          .map(key => typeMap.get(key))
          .filter(Boolean) as NotificationType[];

        await variableRepo.save(variable);
      }

      console.log(`[Seeder] inserted ${savedVariables.length} variables`);
    }
}
