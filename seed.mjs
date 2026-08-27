import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Connecting to database...');
  const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  
  const client = postgres(process.env.DATABASE_URL, { ssl: isLocal ? false : 'require' });
  const db = drizzle(client, { schema });

  console.log('Seeding super admin...');
  
  // Create department if not exists
  let dept = await db.query.department.findFirst();
  if (!dept) {
    await db.insert(schema.department).values({
      name: 'System Administration',
      code: 'SYS',
    });
    dept = await db.query.department.findFirst();
  }

  // Create role if not exists
  let adminRole = await db.query.role.findFirst({
    where: (roles, { eq }) => eq(roles.name, 'SUPER_ADMIN')
  });

  if (!adminRole) {
    await db.insert(schema.role).values({
      name: 'SUPER_ADMIN',
      permissions: { all: true },
    });
    adminRole = await db.query.role.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'SUPER_ADMIN')
    });
  }

  // Check if super admin user exists
  const existingUser = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'admin@sre.co.id')
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(schema.user).values({
      name: 'Super Administrator',
      email: 'admin@sre.co.id',
      password: hashedPassword,
      isActive: true,
      roleId: adminRole.id,
      departmentId: dept.id,
    });
    console.log('Super admin created: admin@sre.co.id / admin123');
  } else {
    console.log('Super admin already exists.');
  }

  console.log('Seeding member...');

  // Create member role if not exists
  let memberRole = await db.query.role.findFirst({
    where: (roles, { eq }) => eq(roles.name, 'MEMBER')
  });

  if (!memberRole) {
    await db.insert(schema.role).values({
      name: 'MEMBER',
      permissions: {},
    });
    memberRole = await db.query.role.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'MEMBER')
    });
  }

  // Check if member user exists
  const existingMember = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'member@sre.co.id')
  });

  if (!existingMember) {
    const hashedMemberPassword = await bcrypt.hash('member123', 10);
    await db.insert(schema.user).values({
      name: 'Default Member',
      email: 'member@sre.co.id',
      password: hashedMemberPassword,
      isActive: true,
      roleId: memberRole.id,
      departmentId: dept.id,
    });
    console.log('Member created: member@sre.co.id / member123');
  } else {
    console.log('Member already exists.');
  }

  // Ensure member profile exists
  const memberUser = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'member@sre.co.id')
  });

  if (memberUser) {
    const existingProfile = await db.query.memberProfile.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, memberUser.id)
    });

    if (!existingProfile) {
      await db.insert(schema.memberProfile).values({
        userId: memberUser.id,
        xp: 0,
        level: 1,
      });
      console.log('Member profile created.');
    } else {
      console.log('Member profile already exists.');
    }
  }

  console.log('Seeding staff...');

  // Create staff role if not exists
  let staffRole = await db.query.role.findFirst({
    where: (roles, { eq }) => eq(roles.name, 'STAFF')
  });

  if (!staffRole) {
    await db.insert(schema.role).values({
      name: 'STAFF',
      permissions: {},
    });
    staffRole = await db.query.role.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'STAFF')
    });
  }

  // Check if staff user exists
  const existingStaff = await db.query.user.findFirst({
    where: (users, { eq }) => eq(users.email, 'staff@sre.co.id')
  });

  if (!existingStaff) {
    const hashedStaffPassword = await bcrypt.hash('password123', 10);
    await db.insert(schema.user).values({
      name: 'Staff Contoh',
      email: 'staff@sre.co.id',
      password: hashedStaffPassword,
      npm: '2023000001',
      positionName: 'Staff Operations',
      isActive: true,
      roleId: staffRole.id,
      departmentId: dept.id,
    });
    console.log('Staff created: staff@sre.co.id / password123');
  } else {
    console.log('Staff already exists.');
  }

  console.log('Seeding complete organization structure...');

  // 1. Departments
  const deptsToSeed = [
    { name: 'Academic Campaign & Education (ACE)', code: 'ACE' },
    { name: 'Human Resource (HR)', code: 'HR' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Media & Creative', code: 'MC' },
    { name: 'Public Relations', code: 'PR' },
    { name: 'Executive', code: 'EXE' }
  ];

  for (const deptData of deptsToSeed) {
    const existing = await db.query.department.findFirst({
      where: (d, { eq, or }) => or(
        eq(d.name, deptData.name),
        eq(d.code, deptData.code)
      )
    });
    if (!existing) {
      await db.insert(schema.department).values(deptData);
      console.log(`Department created: ${deptData.name}`);
    }
  }

  // Load all departments into a map
  const allDepts = await db.query.department.findMany();
  const deptMap = new Map();
  for (const d of allDepts) {
    deptMap.set(d.code, d);
  }

  // 2. Divisions
  const divisionsToSeed = [
    { deptCode: 'ACE', name: 'Academic Division' },
    { deptCode: 'ACE', name: 'Campaign Division' },
    { deptCode: 'ACE', name: 'Plan Project Division' },
    { deptCode: 'HR', name: 'Human Resource Management Division' },
    { deptCode: 'HR', name: 'Human Resource Development Division' },
    { deptCode: 'FIN', name: 'Funding Division' },
    { deptCode: 'FIN', name: 'Sponsorship Division' },
    { deptCode: 'MC', name: 'Creative Design Division' },
    { deptCode: 'MC', name: 'Social Media Division' },
    { deptCode: 'MC', name: 'Web Development Division' },
    { deptCode: 'PR', name: 'Internal Division' },
    { deptCode: 'PR', name: 'External Division' },
  ];

  for (const divData of divisionsToSeed) {
    const departmentObj = deptMap.get(divData.deptCode);
    if (!departmentObj) continue;

    const existing = await db.query.division.findFirst({
      where: (div, { and, eq }) => and(
        eq(div.name, divData.name),
        eq(div.departmentId, departmentObj.id)
      )
    });

    if (!existing) {
      await db.insert(schema.division).values({
        name: divData.name,
        departmentId: departmentObj.id
      });
      console.log(`Division created: ${divData.name} under ${divData.deptCode}`);
    }
  }

  // Load all divisions into a map (key: "deptId:divisionName")
  const allDivs = await db.query.division.findMany();
  const divisionMap = new Map();
  for (const d of allDivs) {
    divisionMap.set(`${d.departmentId}:${d.name}`, d);
  }

  // Map dept column to department code
  const deptKeyToCode = {
    'Executive': 'EXE',
    'ACE': 'ACE',
    'HR': 'HR',
    'Finance': 'FIN',
    'Media & Creative': 'MC',
    'Public Relations': 'PR'
  };

  // Pre-hash password "sre2026" with bcrypt salt 10 for efficiency
  const passwordHash = await bcrypt.hash('sre2026', 10);

  // 3. Users (all members)
  const rawMembers = [
    { name: 'Mirza Jovita Safitri', npm: '23032010105', positionName: 'President', dept: 'Executive', division: '-' },
    { name: 'Rizky Febrian Putra', npm: '23011010127', positionName: 'Vice President Internal', dept: 'Executive', division: '-' },
    { name: 'Muhammad Fauzan Satyasyauqi', npm: '2303101050', positionName: 'Vice President External', dept: 'Executive', division: '-' },
    { name: 'Kendy Wijaya', npm: '24011010181', positionName: 'Secretary 1', dept: 'Executive', division: '-' },
    { name: 'Evi Lailiyatul Annisa', npm: '24031010243', positionName: 'Secretary 2', dept: 'Executive', division: '-' },
    { name: 'Zalva Zahiya Putri A', npm: '24031010143', positionName: 'Director', dept: 'ACE', division: '-' },
    { name: 'Desmond Natanael Sinaga', npm: '23031010014', positionName: 'Manager', dept: 'ACE', division: 'Academic Division' },
    { name: 'Hanifah Manzilatu', npm: '24031010174', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Dalilah Baharmus', npm: '23031010086', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Ahmad Risky Firdiansyah', npm: '25031010093', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Aditya Alvarel', npm: '24031010157', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Muhammad Akmal Attallah', npm: '25031010064', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Yehezkiel Doni Welldy Napitupulu', npm: '23031010039', positionName: 'Staff', dept: 'ACE', division: 'Academic Division' },
    { name: 'Dygta Azzahwa', npm: '23031010175', positionName: 'Manager', dept: 'ACE', division: 'Campaign Division' },
    { name: 'M. Aziz Syukron', npm: '25081010154', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Achmad Rizal', npm: '23031010052', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Muhammad Yusuf Yasjudan', npm: '24032010104', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Karina Indirasari', npm: '24032010211', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Athallah Isnindra Lesmana', npm: '24036010048', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Muhammad Alfath Sultani', npm: '24032010059', positionName: 'Staff', dept: 'ACE', division: 'Campaign Division' },
    { name: 'Hikmal Akbar Habibie', npm: '24034010002', positionName: 'Manager', dept: 'ACE', division: 'Plan Project Division' },
    { name: 'Binti Maratus Sholeha', npm: '25031010137', positionName: 'Staff', dept: 'ACE', division: 'Plan Project Division' },
    { name: 'Faizal Dany Listiantoro', npm: '23031010070', positionName: 'Staff', dept: 'ACE', division: 'Plan Project Division' },
    { name: 'Dani Shofi Nur', npm: '24083010124', positionName: 'Staff', dept: 'ACE', division: 'Plan Project Division' },
    { name: 'Elbra Aliyyah M.', npm: '24031010154', positionName: 'Staff', dept: 'ACE', division: 'Plan Project Division' },
    { name: 'Muhammad Aldin Alifian', npm: '24031010217', positionName: 'Director', dept: 'HR', division: '-' },
    { name: 'iftitah Nurazizah Salwa', npm: '24031010099', positionName: 'Manager', dept: 'HR', division: 'Human Resource Management Division' },
    { name: 'Aufa Rukmana Asri', npm: '25034010078', positionName: 'Staff', dept: 'HR', division: 'Human Resource Management Division' },
    { name: 'Yanis Nabila Jayanti', npm: '24011010144', positionName: 'Staff', dept: 'HR', division: 'Human Resource Management Division' },
    { name: 'Ozzie Dharma Saputra', npm: '24036010045', positionName: 'Staff', dept: 'HR', division: 'Human Resource Management Division' },
    { name: 'Sholichin Chamal', npm: '23031010063', positionName: 'Staff', dept: 'HR', division: 'Human Resource Management Division' },
    { name: 'Gilang Tomi Arisaputra', npm: '24011010124', positionName: 'Manager', dept: 'HR', division: 'Human Resource Development Division' },
    { name: 'Mohammad Fayed Qalby', npm: '24025010160', positionName: 'Staff', dept: 'HR', division: 'Human Resource Development Division' },
    { name: 'Kemas Fatih Amanaser Razan', npm: '24082010102', positionName: 'Staff', dept: 'HR', division: 'Human Resource Development Division' },
    { name: 'Kaffi Islamay Abrar', npm: '24071010138', positionName: 'Staff', dept: 'HR', division: 'Human Resource Development Division' },
    { name: 'Herdanto Tri Bagus Sukma Hadi', npm: '23031010002', positionName: 'Staff', dept: 'HR', division: 'Human Resource Development Division' },
    { name: 'Ninit Agus Ramadhani', npm: '23012010079', positionName: 'Director', dept: 'Finance', division: '-' },
    { name: 'Hilwa Aufa Izzaty Darsono', npm: '24013010298', positionName: 'Manager', dept: 'Finance', division: 'Funding Division' },
    { name: 'Nayla Dwi Pertiwi', npm: '25011010131', positionName: 'Staff', dept: 'Finance', division: 'Funding Division' },
    { name: 'Jacinda Adya Kaylani', npm: '25033010079', positionName: 'Staff', dept: 'Finance', division: 'Funding Division' },
    { name: 'Nindya Aliyah Maulidina', npm: '24013010063', positionName: 'Staff', dept: 'Finance', division: 'Funding Division' },
    { name: 'Yuda Raharja Eka Putra', npm: '25031010010', positionName: 'Staff', dept: 'Finance', division: 'Funding Division' },
    { name: 'Galih Zaky Tristanaya', npm: '24083010088', positionName: 'Manager', dept: 'Finance', division: 'Sponsorship Division' },
    { name: 'Anggun Syafitri', npm: '25034010059', positionName: 'Staff', dept: 'Finance', division: 'Sponsorship Division' },
    { name: 'Silvia Oktaviani Indraswara', npm: '24031010096', positionName: 'Staff', dept: 'Finance', division: 'Sponsorship Division' },
    { name: 'Dewi Astuti', npm: '23031010154', positionName: 'Staff', dept: 'Finance', division: 'Sponsorship Division' },
    { name: 'Muhammad Fadly Alfianurrohman', npm: '25032010265', positionName: 'Staff', dept: 'Finance', division: 'Sponsorship Division' },
    { name: 'Bryan Reinaldo', npm: '24032010055', positionName: 'Director', dept: 'Media & Creative', division: '-' },
    { name: 'Muhammad Raihan Siddiq', npm: '25052010124', positionName: 'Manager', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Myrna Syafrida', npm: '25033010020', positionName: 'Staff', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Ivan Baihaqi Pramana', npm: '24032010119', positionName: 'Staff', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Faqih Romadon', npm: '25031010223', positionName: 'Staff', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Ahmad Naufal', npm: '24014010034', positionName: 'Staff', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Nadia Tsabitah', npm: '25012010529', positionName: 'Staff', dept: 'Media & Creative', division: 'Creative Design Division' },
    { name: 'Nindita Tanaya Radinka Hermawan', npm: '24034010125', positionName: 'Manager', dept: 'Media & Creative', division: 'Social Media Division' },
    { name: 'Raka Panji Rahmatullah', npm: '25034010072', positionName: 'Staff', dept: 'Media & Creative', division: 'Social Media Division' },
    { name: 'Athalia Helen Hemalini', npm: '24034010106', positionName: 'Staff', dept: 'Media & Creative', division: 'Social Media Division' },
    { name: 'Naufal Reyhan Dwinosavero', npm: '24032010246', positionName: 'Staff', dept: 'Media & Creative', division: 'Social Media Division' },
    { name: 'Muhammad Raynar Hammam', npm: '24082010128', positionName: 'Manager', dept: 'Media & Creative', division: 'Web Development Division' },
    { name: 'Ghulamin Chalim Alwi', npm: '25081010173', positionName: 'Staff', dept: 'Media & Creative', division: 'Web Development Division' },
    { name: 'Riko Fernanda Saputra', npm: '25081010301', positionName: 'Staff', dept: 'Media & Creative', division: 'Web Development Division' },
    { name: 'Kaka Dimas Soehendra Putra', npm: '24082010171', positionName: 'Staff', dept: 'Media & Creative', division: 'Web Development Division' },
    { name: 'Himi Imtiyaz Syahputra', npm: '24032010219', positionName: 'Director', dept: 'Public Relations', division: '-' },
    { name: 'Nailah Dinda Nur Aini', npm: '24034010124', positionName: 'Manager', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Muhammad Dhawin Niam', npm: '24034010010', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Muhammad Harish Satria Ikhsan', npm: '24031010150', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Faza Mujahidah Ash-Shiddiq', npm: '25034010051', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Azifahtul Nurul Firdaus', npm: '23031010008', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Nino Ahmadiy', npm: '24083010049', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Melisa Fitria Regina Novianti', npm: '23041010139', positionName: 'Staff', dept: 'Public Relations', division: 'Internal Division' },
    { name: 'Raihan Hafizh Pohan', npm: '24031010137', positionName: 'Manager', dept: 'Public Relations', division: 'External Division' },
    { name: 'Ken Abimanyu', npm: '23031010176', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' },
    { name: 'Muhammad Rama Andhika Gunawan', npm: '23031010170', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' },
    { name: 'Alif Seto Rifai', npm: '24031010082', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' },
    { name: 'Okvivi Fatrisia Manurung', npm: '24081010046', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' },
    { name: 'Shinta Dwi Puspitasari', npm: '24031010026', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' },
    { name: 'Naila Maharani Cahyani Putri', npm: '24032010163', positionName: 'Staff', dept: 'Public Relations', division: 'External Division' }
  ];

  for (const m of rawMembers) {
    const email = `${m.npm}@student.upnjatim.ac.id`;
    let userRecord = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, email)
    });

    if (!userRecord) {
      // Role: SUPER_ADMIN for President, VP Internal, VP External, Directors — STAFF for everyone else
      const isSuperAdmin = ['President', 'Vice President Internal', 'Vice President External', 'Director'].includes(m.positionName);
      const assignedRoleId = isSuperAdmin ? adminRole.id : staffRole.id;

      // Department
      const deptCode = deptKeyToCode[m.dept];
      const departmentObj = deptMap.get(deptCode);
      const departmentId = departmentObj ? departmentObj.id : null;

      // Division
      let divisionId = null;
      if (m.division && m.division !== '-') {
        const divKey = `${departmentId}:${m.division}`;
        const divisionObj = divisionMap.get(divKey);
        divisionId = divisionObj ? divisionObj.id : null;
      }

      await db.insert(schema.user).values({
        name: m.name,
        email,
        password: passwordHash,
        npm: m.npm,
        positionName: m.positionName,
        isActive: true,
        roleId: assignedRoleId,
        departmentId,
        divisionId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      userRecord = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, email)
      });
      console.log(`User created: ${m.name} (${email}) with role ${isSuperAdmin ? 'SUPER_ADMIN' : 'STAFF'}`);
    } else {
      // If user exists, ensure role is updated to STAFF if not a super admin position
      const isSuperAdmin = ['President', 'Vice President Internal', 'Vice President External', 'Director'].includes(m.positionName);
      const targetRoleId = isSuperAdmin ? adminRole.id : staffRole.id;
      
      if (userRecord.roleId !== targetRoleId) {
        await db.update(schema.user)
          .set({ roleId: targetRoleId, positionName: m.positionName })
          .where(eq(schema.user.id, userRecord.id));
        console.log(`Updated role to ${isSuperAdmin ? 'SUPER_ADMIN' : 'STAFF'} for ${m.name}`);
      } else {
        console.log(`User already exists: ${m.name} (${email})`);
      }
    }

    // 5. Ensure memberProfile ONLY for users with MEMBER role
    if (userRecord) {
      if (userRecord.roleId === memberRole.id) {
        const existingProfile = await db.query.memberProfile.findFirst({
          where: (p, { eq }) => eq(p.userId, userRecord.id)
        });
        if (!existingProfile) {
          await db.insert(schema.memberProfile).values({
            userId: userRecord.id,
            xp: 0,
            level: 1,
          });
          console.log(`Member profile created for ${m.name}`);
        }
      } else {
        // Remove memberProfile if exists for non-MEMBER (staff/super admin)
        const existingProfile = await db.query.memberProfile.findFirst({
          where: (p, { eq }) => eq(p.userId, userRecord.id)
        });
        if (existingProfile) {
          await db.delete(schema.memberProfile).where(eq(schema.memberProfile.userId, userRecord.id));
          console.log(`Removed member profile from non-member user: ${m.name}`);
        }
      }
    }
  }

  console.log('Seeding finished.');
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
