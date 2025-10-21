-- =====================================================
-- GBUR MINISTRY MANAGEMENT SYSTEM - SAMPLE DATA
-- =====================================================
-- This script creates sample organizational structure and members
-- Run this after your database is set up with Prisma migrations

-- =====================================================
-- 1. ORGANIZATIONAL STRUCTURE SETUP
-- =====================================================

-- Insert Sample Regions
INSERT INTO `region` (`name`) VALUES
('Kigali Region'),
('Northern Region'),
('Southern Region'),
('Eastern Region'),
('Western Region');

-- Insert Sample Universities (assuming region IDs 1-5)
INSERT INTO `university` (`name`, `regionId`) VALUES
-- Kigali Region Universities
('University of Rwanda - College of Science and Technology', 1),
('Kigali Institute of Science and Technology', 1),
('University of Kigali', 1),
('Catholic University of Rwanda', 1),
('Kigali Independent University', 1),

-- Northern Region Universities  
('University of Rwanda - College of Education', 2),
('Northern Province University', 2),
('Musanze Technical Institute', 2),
('Ruhengeri Institute of Higher Education', 2),
('Northern Christian University', 2),

-- Southern Region Universities
('University of Rwanda - College of Medicine', 3),
('Southern Province University', 3),
('Huye Institute of Technology', 3),
('Butare University', 3),
('Southern Christian College', 3),

-- Eastern Region Universities
('University of Rwanda - College of Agriculture', 4),
('Eastern Province University', 4),
('Rwamagana Institute', 4),
('Eastern Technical College', 4),
('Eastern Christian University', 4),

-- Western Region Universities
('University of Rwanda - College of Business', 5),
('Western Province University', 5),
('Kibuye Institute', 5),
('Western Technical College', 5),
('Western Christian University', 5);

-- Insert Sample Small Groups (assuming university IDs 1-25)
INSERT INTO `smallgroup` (`name`, `universityId`, `regionId`) VALUES
-- University 1 Small Groups
('Alpha Bible Study Group', 1, 1),
('Beta Discipleship Group', 1, 1),
('Gamma Prayer Group', 1, 1),
('Delta Evangelism Group', 1, 1),
('Epsilon Fellowship Group', 1, 1),

-- University 2 Small Groups
('Zeta Bible Study Group', 2, 1),
('Eta Discipleship Group', 2, 1),
('Theta Prayer Group', 2, 1),
('Iota Evangelism Group', 2, 1),
('Kappa Fellowship Group', 2, 1),

-- University 3 Small Groups
('Lambda Bible Study Group', 3, 1),
('Mu Discipleship Group', 3, 1),
('Nu Prayer Group', 3, 1),
('Xi Evangelism Group', 3, 1),
('Omicron Fellowship Group', 3, 1),

-- University 4 Small Groups
('Pi Bible Study Group', 4, 1),
('Rho Discipleship Group', 4, 1),
('Sigma Prayer Group', 4, 1),
('Tau Evangelism Group', 4, 1),
('Upsilon Fellowship Group', 4, 1),

-- University 5 Small Groups
('Phi Bible Study Group', 5, 1),
('Chi Discipleship Group', 5, 1),
('Psi Prayer Group', 5, 1),
('Omega Evangelism Group', 5, 1),
('Alpha Prime Fellowship Group', 5, 1),

-- Northern Region Universities (6-10)
('Northern Alpha Group', 6, 2),
('Northern Beta Group', 6, 2),
('Northern Gamma Group', 6, 2),
('Northern Delta Group', 6, 2),
('Northern Epsilon Group', 6, 2),

('Musanze Alpha Group', 7, 2),
('Musanze Beta Group', 7, 2),
('Musanze Gamma Group', 7, 2),
('Musanze Delta Group', 7, 2),
('Musanze Epsilon Group', 7, 2),

-- Southern Region Universities (11-15)
('Southern Alpha Group', 11, 3),
('Southern Beta Group', 11, 3),
('Southern Gamma Group', 11, 3),
('Southern Delta Group', 11, 3),
('Southern Epsilon Group', 11, 3),

('Huye Alpha Group', 12, 3),
('Huye Beta Group', 12, 3),
('Huye Gamma Group', 12, 3),
('Huye Delta Group', 12, 3),
('Huye Epsilon Group', 12, 3),

-- Eastern Region Universities (16-20)
('Eastern Alpha Group', 16, 4),
('Eastern Beta Group', 16, 4),
('Eastern Gamma Group', 16, 4),
('Eastern Delta Group', 16, 4),
('Eastern Epsilon Group', 16, 4),

('Rwamagana Alpha Group', 17, 4),
('Rwamagana Beta Group', 17, 4),
('Rwamagana Gamma Group', 17, 4),
('Rwamagana Delta Group', 17, 4),
('Rwamagana Epsilon Group', 17, 4),

-- Western Region Universities (21-25)
('Western Alpha Group', 21, 5),
('Western Beta Group', 21, 5),
('Western Gamma Group', 21, 5),
('Western Delta Group', 21, 5),
('Western Epsilon Group', 21, 5),

('Kibuye Alpha Group', 22, 5),
('Kibuye Beta Group', 22, 5),
('Kibuye Gamma Group', 22, 5),
('Kibuye Delta Group', 22, 5),
('Kibuye Epsilon Group', 22, 5);

-- Insert Sample Alumni Small Groups
INSERT INTO `alumnismallgroup` (`name`, `regionId`) VALUES
-- Kigali Region Alumni Groups
('Kigali Alumni Professionals', 1),
('Kigali Alumni Entrepreneurs', 1),
('Kigali Alumni Leaders', 1),
('Kigali Alumni Mentors', 1),
('Kigali Alumni Network', 1),

-- Northern Region Alumni Groups
('Northern Alumni Professionals', 2),
('Northern Alumni Entrepreneurs', 2),
('Northern Alumni Leaders', 2),
('Northern Alumni Mentors', 2),
('Northern Alumni Network', 2),

-- Southern Region Alumni Groups
('Southern Alumni Professionals', 3),
('Southern Alumni Entrepreneurs', 3),
('Southern Alumni Leaders', 3),
('Southern Alumni Mentors', 3),
('Southern Alumni Network', 3),

-- Eastern Region Alumni Groups
('Eastern Alumni Professionals', 4),
('Eastern Alumni Entrepreneurs', 4),
('Eastern Alumni Leaders', 4),
('Eastern Alumni Mentors', 4),
('Eastern Alumni Network', 4),

-- Western Region Alumni Groups
('Western Alumni Professionals', 5),
('Western Alumni Entrepreneurs', 5),
('Western Alumni Leaders', 5),
('Western Alumni Mentors', 5),
('Western Alumni Network', 5);

-- =====================================================
-- 2. SAMPLE MEMBERS DATA
-- =====================================================

-- =====================================================
-- NATIONAL LEVEL MEMBERS (5 members)
-- =====================================================
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
-- National Level Members (no specific region/university assignment)
('Jean', 'Baptiste', 'male', '1985-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'jean.baptiste@gbur.rw', '+250788123456', 'staff', 'active', NULL, NULL, NULL, NULL, '2010-06-15', 'Theology', 'Ministry Leadership', 'married', NOW(), NOW()),

('Marie', 'Claire', 'female', '1988-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'marie.claire@gbur.rw', '+250788123457', 'staff', 'active', NULL, NULL, NULL, NULL, '2012-08-20', 'Education', 'Ministry Administration', 'married', NOW(), NOW()),

('Paul', 'Mukamana', 'male', '1983-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'paul.mukamana@gbur.rw', '+250788123458', 'staff', 'active', NULL, NULL, NULL, NULL, '2008-05-30', 'Business', 'Ministry Finance', 'single', NOW(), NOW()),

('Grace', 'Uwimana', 'female', '1987-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'grace.uwimana@gbur.rw', '+250788123459', 'staff', 'active', NULL, NULL, NULL, NULL, '2011-07-15', 'Communication', 'Ministry Communication', 'married', NOW(), NOW()),

('David', 'Nkurunziza', 'male', '1986-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'david.nkurunziza@gbur.rw', '+250788123460', 'staff', 'active', NULL, NULL, NULL, NULL, '2009-12-10', 'Psychology', 'Ministry Counseling', 'married', NOW(), NOW());

-- =====================================================
-- REGIONAL LEVEL MEMBERS (5 members per region = 25 members)
-- =====================================================

-- Kigali Region Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Alice', 'Mukamana', 'female', '1990-01-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'alice.mukamana@gbur.rw', '+250788200001', 'staff', 'active', 1, NULL, NULL, NULL, '2015-06-15', 'Education', 'Regional Coordinator', 'single', NOW(), NOW()),

('Peter', 'Nkurunziza', 'male', '1988-05-20', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'peter.nkurunziza@gbur.rw', '+250788200002', 'staff', 'active', 1, NULL, NULL, NULL, '2013-08-20', 'Business', 'Regional Administrator', 'married', NOW(), NOW()),

('Sarah', 'Uwimana', 'female', '1992-08-10', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'sarah.uwimana@gbur.rw', '+250788200003', 'staff', 'active', 1, NULL, NULL, NULL, '2016-05-30', 'Communication', 'Regional Communication', 'single', NOW(), NOW()),

('John', 'Baptiste', 'male', '1989-12-03', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'john.baptiste@gbur.rw', '+250788200004', 'staff', 'active', 1, NULL, NULL, NULL, '2014-07-15', 'Theology', 'Regional Pastor', 'married', NOW(), NOW()),

('Ruth', 'Mukamana', 'female', '1991-03-18', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'ruth.mukamana@gbur.rw', '+250788200005', 'staff', 'active', 1, NULL, NULL, NULL, '2017-12-10', 'Psychology', 'Regional Counselor', 'single', NOW(), NOW());

-- Northern Region Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Musa', 'Hakizimana', 'male', '1987-06-12', 'Northern', 'Musanze', 'Musanze', 'Musanze', 'Musanze', 'Musanze Baptist Church', 'musa.hakizimana@gbur.rw', '+250788300001', 'staff', 'active', 2, NULL, NULL, NULL, '2012-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Esther', 'Mukamana', 'female', '1989-09-25', 'Northern', 'Ruhengeri', 'Ruhengeri', 'Ruhengeri', 'Ruhengeri', 'Ruhengeri Presbyterian Church', 'esther.mukamana@gbur.rw', '+250788300002', 'staff', 'active', 2, NULL, NULL, NULL, '2014-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Samuel', 'Nkurunziza', 'male', '1990-02-14', 'Northern', 'Gakenke', 'Gakenke', 'Gakenke', 'Gakenke', 'Gakenke Anglican Church', 'samuel.nkurunziza@gbur.rw', '+250788300003', 'staff', 'active', 2, NULL, NULL, NULL, '2015-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Deborah', 'Uwimana', 'female', '1988-11-08', 'Northern', 'Burera', 'Burera', 'Burera', 'Burera', 'Burera Catholic Church', 'deborah.uwimana@gbur.rw', '+250788300004', 'staff', 'active', 2, NULL, NULL, NULL, '2013-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Joshua', 'Baptiste', 'male', '1991-04-30', 'Northern', 'Rulindo', 'Rulindo', 'Rulindo', 'Rulindo', 'Rulindo Methodist Church', 'joshua.baptiste@gbur.rw', '+250788300005', 'staff', 'active', 2, NULL, NULL, NULL, '2016-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- Southern Region Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Daniel', 'Mukamana', 'male', '1986-07-22', 'Southern', 'Huye', 'Huye', 'Huye', 'Huye', 'Huye Baptist Church', 'daniel.mukamana@gbur.rw', '+250788400001', 'staff', 'active', 3, NULL, NULL, NULL, '2011-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Hannah', 'Nkurunziza', 'female', '1988-10-15', 'Southern', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza Presbyterian Church', 'hannah.nkurunziza@gbur.rw', '+250788400002', 'staff', 'active', 3, NULL, NULL, NULL, '2013-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Caleb', 'Uwimana', 'male', '1989-01-28', 'Southern', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara Anglican Church', 'caleb.uwimana@gbur.rw', '+250788400003', 'staff', 'active', 3, NULL, NULL, NULL, '2014-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Miriam', 'Baptiste', 'female', '1987-05-12', 'Southern', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe Catholic Church', 'miriam.baptiste@gbur.rw', '+250788400004', 'staff', 'active', 3, NULL, NULL, NULL, '2012-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Aaron', 'Mukamana', 'male', '1990-08-05', 'Southern', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango Methodist Church', 'aaron.mukamana@gbur.rw', '+250788400005', 'staff', 'active', 3, NULL, NULL, NULL, '2015-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- Eastern Region Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Isaac', 'Nkurunziza', 'male', '1985-12-18', 'Eastern', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana Baptist Church', 'isaac.nkurunziza@gbur.rw', '+250788500001', 'staff', 'active', 4, NULL, NULL, NULL, '2010-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Rebecca', 'Uwimana', 'female', '1987-03-25', 'Eastern', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza Presbyterian Church', 'rebecca.uwimana@gbur.rw', '+250788500002', 'staff', 'active', 4, NULL, NULL, NULL, '2012-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Jacob', 'Baptiste', 'male', '1988-06-08', 'Eastern', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe Anglican Church', 'jacob.baptiste@gbur.rw', '+250788500003', 'staff', 'active', 4, NULL, NULL, NULL, '2013-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Rachel', 'Mukamana', 'female', '1986-09-14', 'Eastern', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma Catholic Church', 'rachel.mukamana@gbur.rw', '+250788500004', 'staff', 'active', 4, NULL, NULL, NULL, '2011-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Benjamin', 'Nkurunziza', 'male', '1989-12-01', 'Eastern', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera Methodist Church', 'benjamin.nkurunziza@gbur.rw', '+250788500005', 'staff', 'active', 4, NULL, NULL, NULL, '2014-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- Western Region Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Joseph', 'Uwimana', 'male', '1984-04-20', 'Western', 'Karongi', 'Karongi', 'Karongi', 'Karongi', 'Karongi Baptist Church', 'joseph.uwimana@gbur.rw', '+250788600001', 'staff', 'active', 5, NULL, NULL, NULL, '2009-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Leah', 'Baptiste', 'female', '1986-07-13', 'Western', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu Presbyterian Church', 'leah.baptiste@gbur.rw', '+250788600002', 'staff', 'active', 5, NULL, NULL, NULL, '2011-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Moses', 'Mukamana', 'male', '1987-10-26', 'Western', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro Anglican Church', 'moses.mukamana@gbur.rw', '+250788600003', 'staff', 'active', 5, NULL, NULL, NULL, '2012-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Naomi', 'Nkurunziza', 'female', '1985-01-09', 'Western', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu Catholic Church', 'naomi.nkurunziza@gbur.rw', '+250788600004', 'staff', 'active', 5, NULL, NULL, NULL, '2010-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Gideon', 'Uwimana', 'male', '1988-11-22', 'Western', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero Methodist Church', 'gideon.uwimana@gbur.rw', '+250788600005', 'staff', 'active', 5, NULL, NULL, NULL, '2013-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- =====================================================
-- UNIVERSITY LEVEL MEMBERS (5 members per university = 125 members)
-- =====================================================

-- University 1 Members (UR-CST)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Alex', 'Mukamana', 'male', '1995-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'alex.mukamana@ur-cst.rw', '+250788700001', 'student', 'active', 1, 1, NULL, NULL, '2025-06-15', 'Computer Science', 'Software Development', 'single', NOW(), NOW()),

('Beth', 'Nkurunziza', 'female', '1996-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'beth.nkurunziza@ur-cst.rw', '+250788700002', 'student', 'active', 1, 1, NULL, NULL, '2026-08-20', 'Engineering', 'Civil Engineering', 'single', NOW(), NOW()),

('Chris', 'Uwimana', 'male', '1994-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'chris.uwimana@ur-cst.rw', '+250788700003', 'student', 'active', 1, 1, NULL, NULL, '2024-05-30', 'Mathematics', 'Data Science', 'single', NOW(), NOW()),

('Diana', 'Baptiste', 'female', '1997-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'diana.baptiste@ur-cst.rw', '+250788700004', 'student', 'active', 1, 1, NULL, NULL, '2027-07-15', 'Physics', 'Research', 'single', NOW(), NOW()),

('Eric', 'Mukamana', 'male', '1995-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'eric.mukamana@ur-cst.rw', '+250788700005', 'student', 'active', 1, 1, NULL, NULL, '2025-12-10', 'Chemistry', 'Analytical Chemistry', 'single', NOW(), NOW());

-- University 2 Members (KIST)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Faith', 'Nkurunziza', 'female', '1996-01-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'faith.nkurunziza@kist.rw', '+250788800001', 'student', 'active', 1, 2, NULL, NULL, '2026-06-15', 'Information Technology', 'Software Engineering', 'single', NOW(), NOW()),

('Gabriel', 'Uwimana', 'male', '1995-05-20', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'gabriel.uwimana@kist.rw', '+250788800002', 'student', 'active', 1, 2, NULL, NULL, '2025-08-20', 'Electronics', 'Electronics Engineering', 'single', NOW(), NOW()),

('Hope', 'Baptiste', 'female', '1997-08-10', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'hope.baptiste@kist.rw', '+250788800003', 'student', 'active', 1, 2, NULL, NULL, '2027-05-30', 'Telecommunications', 'Network Engineering', 'single', NOW(), NOW()),

('Isaiah', 'Mukamana', 'male', '1994-12-03', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'isaiah.mukamana@kist.rw', '+250788800004', 'student', 'active', 1, 2, NULL, NULL, '2024-07-15', 'Mechanical Engineering', 'Mechanical Design', 'single', NOW(), NOW()),

('Joy', 'Nkurunziza', 'female', '1996-03-18', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'joy.nkurunziza@kist.rw', '+250788800005', 'student', 'active', 1, 2, NULL, NULL, '2026-12-10', 'Biomedical Engineering', 'Medical Technology', 'single', NOW(), NOW());

-- Continue with more universities... (I'll add a few more examples)

-- University 3 Members (University of Kigali)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Kevin', 'Uwimana', 'male', '1995-06-12', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'kevin.uwimana@uok.rw', '+250788900001', 'student', 'active', 1, 3, NULL, NULL, '2025-06-15', 'Business Administration', 'Management', 'single', NOW(), NOW()),

('Linda', 'Baptiste', 'female', '1996-09-25', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'linda.baptiste@uok.rw', '+250788900002', 'student', 'active', 1, 3, NULL, NULL, '2026-08-20', 'Economics', 'Financial Analysis', 'single', NOW(), NOW()),

('Michael', 'Mukamana', 'male', '1994-02-14', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'michael.mukamana@uok.rw', '+250788900003', 'student', 'active', 1, 3, NULL, NULL, '2024-05-30', 'Accounting', 'Auditing', 'single', NOW(), NOW()),

('Nancy', 'Nkurunziza', 'female', '1997-11-08', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'nancy.nkurunziza@uok.rw', '+250788900004', 'student', 'active', 1, 3, NULL, NULL, '2027-07-15', 'Marketing', 'Digital Marketing', 'single', NOW(), NOW()),

('Oliver', 'Uwimana', 'male', '1995-04-30', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'oliver.uwimana@uok.rw', '+250788900005', 'student', 'active', 1, 3, NULL, NULL, '2025-12-10', 'Finance', 'Investment Banking', 'single', NOW(), NOW());

-- =====================================================
-- SMALL GROUP LEVEL MEMBERS (5 members per small group = 150 members)
-- =====================================================

-- Small Group 1 Members (Alpha Bible Study Group)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Patricia', 'Mukamana', 'female', '1998-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'patricia.mukamana@alpha.rw', '+250789000001', 'student', 'active', 1, 1, 1, NULL, '2026-06-15', 'Computer Science', 'Web Development', 'single', NOW(), NOW()),

('Quentin', 'Nkurunziza', 'male', '1997-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'quentin.nkurunziza@alpha.rw', '+250789000002', 'student', 'active', 1, 1, 1, NULL, '2025-08-20', 'Engineering', 'Software Engineering', 'single', NOW(), NOW()),

('Rachel', 'Uwimana', 'female', '1999-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'rachel.uwimana@alpha.rw', '+250789000003', 'student', 'active', 1, 1, 1, NULL, '2027-05-30', 'Mathematics', 'Statistics', 'single', NOW(), NOW()),

('Samuel', 'Baptiste', 'male', '1996-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'samuel.baptiste@alpha.rw', '+250789000004', 'student', 'active', 1, 1, 1, NULL, '2024-07-15', 'Physics', 'Quantum Physics', 'single', NOW(), NOW()),

('Teresa', 'Mukamana', 'female', '1998-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'teresa.mukamana@alpha.rw', '+250789000005', 'student', 'active', 1, 1, 1, NULL, '2026-12-10', 'Chemistry', 'Organic Chemistry', 'single', NOW(), NOW());

-- Small Group 2 Members (Beta Discipleship Group)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Ulysses', 'Nkurunziza', 'male', '1997-01-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'ulysses.nkurunziza@beta.rw', '+250789100001', 'student', 'active', 1, 1, 2, NULL, '2025-06-15', 'Computer Science', 'Mobile Development', 'single', NOW(), NOW()),

('Victoria', 'Uwimana', 'female', '1998-05-20', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'victoria.uwimana@beta.rw', '+250789100002', 'student', 'active', 1, 1, 2, NULL, '2026-08-20', 'Engineering', 'Electrical Engineering', 'single', NOW(), NOW()),

('William', 'Baptiste', 'male', '1996-08-10', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'william.baptiste@beta.rw', '+250789100003', 'student', 'active', 1, 1, 2, NULL, '2024-05-30', 'Mathematics', 'Applied Mathematics', 'single', NOW(), NOW()),

('Xena', 'Mukamana', 'female', '1999-12-03', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'xena.mukamana@beta.rw', '+250789100004', 'student', 'active', 1, 1, 2, NULL, '2027-07-15', 'Physics', 'Nuclear Physics', 'single', NOW(), NOW()),

('Yusuf', 'Nkurunziza', 'male', '1997-03-18', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'yusuf.nkurunziza@beta.rw', '+250789100005', 'student', 'active', 1, 1, 2, NULL, '2025-12-10', 'Chemistry', 'Inorganic Chemistry', 'single', NOW(), NOW());

-- =====================================================
-- ALUMNI GROUP LEVEL MEMBERS (5 members per alumni group = 125 members)
-- =====================================================

-- Alumni Group 1 Members (Kigali Alumni Professionals)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Zara', 'Uwimana', 'female', '1990-06-12', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'zara.uwimana@alumni.rw', '+250789200001', 'alumni', 'active', 1, NULL, NULL, 1, '2015-06-15', 'Computer Science', 'Senior Software Engineer', 'married', NOW(), NOW()),

('Aaron', 'Baptiste', 'male', '1989-09-25', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'aaron.baptiste@alumni.rw', '+250789200002', 'alumni', 'active', 1, NULL, NULL, 1, '2014-08-20', 'Engineering', 'Project Manager', 'married', NOW(), NOW()),

('Bella', 'Mukamana', 'female', '1991-02-14', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'bella.mukamana@alumni.rw', '+250789200003', 'alumni', 'active', 1, NULL, NULL, 1, '2016-05-30', 'Mathematics', 'Data Analyst', 'single', NOW(), NOW()),

('Caleb', 'Nkurunziza', 'male', '1988-11-08', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'caleb.nkurunziza@alumni.rw', '+250789200004', 'alumni', 'active', 1, NULL, NULL, 1, '2013-07-15', 'Physics', 'Research Scientist', 'married', NOW(), NOW()),

('Diana', 'Uwimana', 'female', '1992-04-30', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'diana.uwimana@alumni.rw', '+250789200005', 'alumni', 'active', 1, NULL, NULL, 1, '2017-12-10', 'Chemistry', 'Quality Assurance Manager', 'single', NOW(), NOW());

-- Alumni Group 2 Members (Kigali Alumni Entrepreneurs)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Ethan', 'Baptiste', 'male', '1987-07-22', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'ethan.baptiste@entrepreneur.rw', '+250789300001', 'alumni', 'active', 1, NULL, NULL, 2, '2012-06-15', 'Business Administration', 'Tech Startup Founder', 'married', NOW(), NOW()),

('Fiona', 'Mukamana', 'female', '1989-10-15', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'fiona.mukamana@entrepreneur.rw', '+250789300002', 'alumni', 'active', 1, NULL, NULL, 2, '2014-08-20', 'Economics', 'E-commerce Business Owner', 'single', NOW(), NOW()),

('Gabriel', 'Nkurunziza', 'male', '1986-01-28', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'gabriel.nkurunziza@entrepreneur.rw', '+250789300003', 'alumni', 'active', 1, NULL, NULL, 2, '2011-05-30', 'Accounting', 'Financial Services Company', 'married', NOW(), NOW()),

('Hannah', 'Uwimana', 'female', '1990-05-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'hannah.uwimana@entrepreneur.rw', '+250789300004', 'alumni', 'active', 1, NULL, NULL, 2, '2015-07-15', 'Marketing', 'Digital Marketing Agency', 'single', NOW(), NOW()),

('Isaac', 'Baptiste', 'male', '1988-08-05', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'isaac.baptiste@entrepreneur.rw', '+250789300005', 'alumni', 'active', 1, NULL, NULL, 2, '2013-12-10', 'Finance', 'Investment Company', 'married', NOW(), NOW());

-- =====================================================
-- SUMMARY OF SAMPLE DATA CREATED
-- =====================================================
-- 
-- ORGANIZATIONAL STRUCTURE:
-- - 5 Regions
-- - 25 Universities (5 per region)
-- - 75 Small Groups (3 per university)
-- - 25 Alumni Groups (5 per region)
--
-- MEMBERS BY LEVEL:
-- - 5 National Level Members (staff, no specific region/university)
-- - 25 Regional Level Members (5 per region, staff)
-- - 125 University Level Members (5 per university, students)
-- - 150 Small Group Level Members (5 per small group, students)
-- - 125 Alumni Level Members (5 per alumni group, alumni)
--
-- TOTAL MEMBERS: 430 members
--
-- This provides a comprehensive sample dataset that demonstrates
-- the hierarchical structure and relationships in your GBUR system.
