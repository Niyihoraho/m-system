-- =====================================================
-- GBUR MINISTRY MANAGEMENT SYSTEM - SAMPLE MEMBERS ONLY
-- =====================================================
-- This script adds sample members to your existing organizational structure
-- Based on your existing data: Regions 1,3,4,5 and Universities 2,3,4,5

-- =====================================================
-- SAMPLE MEMBERS FOR EXISTING ORGANIZATIONAL STRUCTURE
-- =====================================================

-- =====================================================
-- NATIONAL LEVEL MEMBERS (5 members - no specific assignment)
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
('Jean', 'Baptiste', 'male', '1985-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'jean.baptiste@gbur.rw', '+250788123456', 'staff', 'active', NULL, NULL, NULL, NULL, '2010-06-15', 'Theology', 'Ministry Leadership', 'married', NOW(), NOW()),

('Marie', 'Claire', 'female', '1988-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'marie.claire@gbur.rw', '+250788123457', 'staff', 'active', NULL, NULL, NULL, NULL, '2012-08-20', 'Education', 'Ministry Administration', 'married', NOW(), NOW()),

('Paul', 'Mukamana', 'male', '1983-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'paul.mukamana@gbur.rw', '+250788123458', 'staff', 'active', NULL, NULL, NULL, NULL, '2008-05-30', 'Business', 'Ministry Finance', 'single', NOW(), NOW()),

('Grace', 'Uwimana', 'female', '1987-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'grace.uwimana@gbur.rw', '+250788123459', 'staff', 'active', NULL, NULL, NULL, NULL, '2011-07-15', 'Communication', 'Ministry Communication', 'married', NOW(), NOW()),

('David', 'Nkurunziza', 'male', '1986-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'david.nkurunziza@gbur.rw', '+250788123460', 'staff', 'active', NULL, NULL, NULL, NULL, '2009-12-10', 'Psychology', 'Ministry Counseling', 'married', NOW(), NOW());

-- =====================================================
-- REGIONAL LEVEL MEMBERS (5 members per existing region)
-- =====================================================

-- Region 1 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Alice', 'Mukamana', 'female', '1990-01-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'alice.mukamana@region1.rw', '+250788200001', 'staff', 'active', 1, NULL, NULL, NULL, '2015-06-15', 'Education', 'Regional Coordinator', 'single', NOW(), NOW()),

('Peter', 'Nkurunziza', 'male', '1988-05-20', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'peter.nkurunziza@region1.rw', '+250788200002', 'staff', 'active', 1, NULL, NULL, NULL, '2013-08-20', 'Business', 'Regional Administrator', 'married', NOW(), NOW()),

('Sarah', 'Uwimana', 'female', '1992-08-10', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'sarah.uwimana@region1.rw', '+250788200003', 'staff', 'active', 1, NULL, NULL, NULL, '2016-05-30', 'Communication', 'Regional Communication', 'single', NOW(), NOW()),

('John', 'Baptiste', 'male', '1989-12-03', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'john.baptiste@region1.rw', '+250788200004', 'staff', 'active', 1, NULL, NULL, NULL, '2014-07-15', 'Theology', 'Regional Pastor', 'married', NOW(), NOW()),

('Ruth', 'Mukamana', 'female', '1991-03-18', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'ruth.mukamana@region1.rw', '+250788200005', 'staff', 'active', 1, NULL, NULL, NULL, '2017-12-10', 'Psychology', 'Regional Counselor', 'single', NOW(), NOW());

-- Region 3 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Daniel', 'Mukamana', 'male', '1986-07-22', 'Southern', 'Huye', 'Huye', 'Huye', 'Huye', 'Huye Baptist Church', 'daniel.mukamana@region3.rw', '+250788300001', 'staff', 'active', 3, NULL, NULL, NULL, '2011-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Hannah', 'Nkurunziza', 'female', '1988-10-15', 'Southern', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza Presbyterian Church', 'hannah.nkurunziza@region3.rw', '+250788300002', 'staff', 'active', 3, NULL, NULL, NULL, '2013-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Caleb', 'Uwimana', 'male', '1989-01-28', 'Southern', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara Anglican Church', 'caleb.uwimana@region3.rw', '+250788300003', 'staff', 'active', 3, NULL, NULL, NULL, '2014-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Miriam', 'Baptiste', 'female', '1987-05-12', 'Southern', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe Catholic Church', 'miriam.baptiste@region3.rw', '+250788300004', 'staff', 'active', 3, NULL, NULL, NULL, '2012-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Aaron', 'Mukamana', 'male', '1990-08-05', 'Southern', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango Methodist Church', 'aaron.mukamana@region3.rw', '+250788300005', 'staff', 'active', 3, NULL, NULL, NULL, '2015-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- Region 4 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Isaac', 'Nkurunziza', 'male', '1985-12-18', 'Eastern', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana Baptist Church', 'isaac.nkurunziza@region4.rw', '+250788400001', 'staff', 'active', 4, NULL, NULL, NULL, '2010-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Rebecca', 'Uwimana', 'female', '1987-03-25', 'Eastern', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza Presbyterian Church', 'rebecca.uwimana@region4.rw', '+250788400002', 'staff', 'active', 4, NULL, NULL, NULL, '2012-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Jacob', 'Baptiste', 'male', '1988-06-08', 'Eastern', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe Anglican Church', 'jacob.baptiste@region4.rw', '+250788400003', 'staff', 'active', 4, NULL, NULL, NULL, '2013-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Rachel', 'Mukamana', 'female', '1986-09-14', 'Eastern', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma Catholic Church', 'rachel.mukamana@region4.rw', '+250788400004', 'staff', 'active', 4, NULL, NULL, NULL, '2011-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Benjamin', 'Nkurunziza', 'male', '1989-12-01', 'Eastern', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera Methodist Church', 'benjamin.nkurunziza@region4.rw', '+250788400005', 'staff', 'active', 4, NULL, NULL, NULL, '2014-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- Region 5 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Joseph', 'Uwimana', 'male', '1984-04-20', 'Western', 'Karongi', 'Karongi', 'Karongi', 'Karongi', 'Karongi Baptist Church', 'joseph.uwimana@region5.rw', '+250788500001', 'staff', 'active', 5, NULL, NULL, NULL, '2009-06-15', 'Education', 'Regional Coordinator', 'married', NOW(), NOW()),

('Leah', 'Baptiste', 'female', '1986-07-13', 'Western', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu Presbyterian Church', 'leah.baptiste@region5.rw', '+250788500002', 'staff', 'active', 5, NULL, NULL, NULL, '2011-08-20', 'Business', 'Regional Administrator', 'single', NOW(), NOW()),

('Moses', 'Mukamana', 'male', '1987-10-26', 'Western', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro Anglican Church', 'moses.mukamana@region5.rw', '+250788500003', 'staff', 'active', 5, NULL, NULL, NULL, '2012-05-30', 'Communication', 'Regional Communication', 'married', NOW(), NOW()),

('Naomi', 'Nkurunziza', 'female', '1985-01-09', 'Western', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu Catholic Church', 'naomi.nkurunziza@region5.rw', '+250788500004', 'staff', 'active', 5, NULL, NULL, NULL, '2010-07-15', 'Theology', 'Regional Pastor', 'single', NOW(), NOW()),

('Gideon', 'Uwimana', 'male', '1988-11-22', 'Western', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero Methodist Church', 'gideon.uwimana@region5.rw', '+250788500005', 'staff', 'active', 5, NULL, NULL, NULL, '2013-12-10', 'Psychology', 'Regional Counselor', 'married', NOW(), NOW());

-- =====================================================
-- UNIVERSITY LEVEL MEMBERS (5 members per existing university)
-- =====================================================

-- University 2 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Alex', 'Mukamana', 'male', '1995-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'alex.mukamana@university2.rw', '+250788600001', 'student', 'active', 1, 2, NULL, NULL, '2025-06-15', 'Computer Science', 'Software Development', 'single', NOW(), NOW()),

('Beth', 'Nkurunziza', 'female', '1996-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'beth.nkurunziza@university2.rw', '+250788600002', 'student', 'active', 1, 2, NULL, NULL, '2026-08-20', 'Engineering', 'Civil Engineering', 'single', NOW(), NOW()),

('Chris', 'Uwimana', 'male', '1994-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'chris.uwimana@university2.rw', '+250788600003', 'student', 'active', 1, 2, NULL, NULL, '2024-05-30', 'Mathematics', 'Data Science', 'single', NOW(), NOW()),

('Diana', 'Baptiste', 'female', '1997-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'diana.baptiste@university2.rw', '+250788600004', 'student', 'active', 1, 2, NULL, NULL, '2027-07-15', 'Physics', 'Research', 'single', NOW(), NOW()),

('Eric', 'Mukamana', 'male', '1995-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'eric.mukamana@university2.rw', '+250788600005', 'student', 'active', 1, 2, NULL, NULL, '2025-12-10', 'Chemistry', 'Analytical Chemistry', 'single', NOW(), NOW());

-- University 3 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Faith', 'Nkurunziza', 'female', '1996-01-15', 'Southern', 'Huye', 'Huye', 'Huye', 'Huye', 'Huye Baptist Church', 'faith.nkurunziza@university3.rw', '+250788700001', 'student', 'active', 3, 3, NULL, NULL, '2026-06-15', 'Information Technology', 'Software Engineering', 'single', NOW(), NOW()),

('Gabriel', 'Uwimana', 'male', '1995-05-20', 'Southern', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza Presbyterian Church', 'gabriel.uwimana@university3.rw', '+250788700002', 'student', 'active', 3, 3, NULL, NULL, '2025-08-20', 'Electronics', 'Electronics Engineering', 'single', NOW(), NOW()),

('Hope', 'Baptiste', 'female', '1997-08-10', 'Southern', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara Anglican Church', 'hope.baptiste@university3.rw', '+250788700003', 'student', 'active', 3, 3, NULL, NULL, '2027-05-30', 'Telecommunications', 'Network Engineering', 'single', NOW(), NOW()),

('Isaiah', 'Mukamana', 'male', '1994-12-03', 'Southern', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe Catholic Church', 'isaiah.mukamana@university3.rw', '+250788700004', 'student', 'active', 3, 3, NULL, NULL, '2024-07-15', 'Mechanical Engineering', 'Mechanical Design', 'single', NOW(), NOW()),

('Joy', 'Nkurunziza', 'female', '1996-03-18', 'Southern', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango Methodist Church', 'joy.nkurunziza@university3.rw', '+250788700005', 'student', 'active', 3, 3, NULL, NULL, '2026-12-10', 'Biomedical Engineering', 'Medical Technology', 'single', NOW(), NOW());

-- University 4 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Kevin', 'Uwimana', 'male', '1995-06-12', 'Eastern', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana Baptist Church', 'kevin.uwimana@university4.rw', '+250788800001', 'student', 'active', 4, 4, NULL, NULL, '2025-06-15', 'Business Administration', 'Management', 'single', NOW(), NOW()),

('Linda', 'Baptiste', 'female', '1996-09-25', 'Eastern', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza Presbyterian Church', 'linda.baptiste@university4.rw', '+250788800002', 'student', 'active', 4, 4, NULL, NULL, '2026-08-20', 'Economics', 'Financial Analysis', 'single', NOW(), NOW()),

('Michael', 'Mukamana', 'male', '1994-02-14', 'Eastern', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe Anglican Church', 'michael.mukamana@university4.rw', '+250788800003', 'student', 'active', 4, 4, NULL, NULL, '2024-05-30', 'Accounting', 'Auditing', 'single', NOW(), NOW()),

('Nancy', 'Nkurunziza', 'female', '1997-11-08', 'Eastern', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma Catholic Church', 'nancy.nkurunziza@university4.rw', '+250788800004', 'student', 'active', 4, 4, NULL, NULL, '2027-07-15', 'Marketing', 'Digital Marketing', 'single', NOW(), NOW()),

('Oliver', 'Uwimana', 'male', '1995-04-30', 'Eastern', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera Methodist Church', 'oliver.uwimana@university4.rw', '+250788800005', 'student', 'active', 4, 4, NULL, NULL, '2025-12-10', 'Finance', 'Investment Banking', 'single', NOW(), NOW());

-- University 5 Members
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Patricia', 'Mukamana', 'female', '1995-03-15', 'Western', 'Karongi', 'Karongi', 'Karongi', 'Karongi', 'Karongi Baptist Church', 'patricia.mukamana@university5.rw', '+250788900001', 'student', 'active', 5, 5, NULL, NULL, '2025-06-15', 'Computer Science', 'Web Development', 'single', NOW(), NOW()),

('Quentin', 'Nkurunziza', 'male', '1996-07-22', 'Western', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu Presbyterian Church', 'quentin.nkurunziza@university5.rw', '+250788900002', 'student', 'active', 5, 5, NULL, NULL, '2026-08-20', 'Engineering', 'Software Engineering', 'single', NOW(), NOW()),

('Rachel', 'Uwimana', 'female', '1994-11-08', 'Western', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro Anglican Church', 'rachel.uwimana@university5.rw', '+250788900003', 'student', 'active', 5, 5, NULL, NULL, '2024-05-30', 'Mathematics', 'Statistics', 'single', NOW(), NOW()),

('Samuel', 'Baptiste', 'male', '1997-04-12', 'Western', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu Catholic Church', 'samuel.baptiste@university5.rw', '+250788900004', 'student', 'active', 5, 5, NULL, NULL, '2027-07-15', 'Physics', 'Quantum Physics', 'single', NOW(), NOW()),

('Teresa', 'Mukamana', 'female', '1995-09-25', 'Western', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero Methodist Church', 'teresa.mukamana@university5.rw', '+250788900005', 'student', 'active', 5, 5, NULL, NULL, '2025-12-10', 'Chemistry', 'Organic Chemistry', 'single', NOW(), NOW());

-- =====================================================
-- SMALL GROUP LEVEL MEMBERS (5 members per existing small group)
-- =====================================================

-- Small Group 1 Members (Grace)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Ulysses', 'Nkurunziza', 'male', '1997-01-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'ulysses.nkurunziza@grace.rw', '+250789000001', 'student', 'active', 1, 2, 1, NULL, '2025-06-15', 'Computer Science', 'Mobile Development', 'single', NOW(), NOW()),

('Victoria', 'Uwimana', 'female', '1998-05-20', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'victoria.uwimana@grace.rw', '+250789000002', 'student', 'active', 1, 2, 1, NULL, '2026-08-20', 'Engineering', 'Electrical Engineering', 'single', NOW(), NOW()),

('William', 'Baptiste', 'male', '1996-08-10', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'william.baptiste@grace.rw', '+250789000003', 'student', 'active', 1, 2, 1, NULL, '2024-05-30', 'Mathematics', 'Applied Mathematics', 'single', NOW(), NOW()),

('Xena', 'Mukamana', 'female', '1999-12-03', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'xena.mukamana@grace.rw', '+250789000004', 'student', 'active', 1, 2, 1, NULL, '2027-07-15', 'Physics', 'Nuclear Physics', 'single', NOW(), NOW()),

('Yusuf', 'Nkurunziza', 'male', '1997-03-18', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'yusuf.nkurunziza@grace.rw', '+250789000005', 'student', 'active', 1, 2, 1, NULL, '2025-12-10', 'Chemistry', 'Inorganic Chemistry', 'single', NOW(), NOW());

-- Small Group 2 Members (Faith)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Zara', 'Uwimana', 'female', '1998-06-12', 'Eastern', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana Baptist Church', 'zara.uwimana@faith.rw', '+250789100001', 'student', 'active', 4, 4, 2, NULL, '2026-06-15', 'Computer Science', 'Web Development', 'single', NOW(), NOW()),

('Aaron', 'Baptiste', 'male', '1997-09-25', 'Eastern', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza Presbyterian Church', 'aaron.baptiste@faith.rw', '+250789100002', 'student', 'active', 4, 4, 2, NULL, '2025-08-20', 'Engineering', 'Software Engineering', 'single', NOW(), NOW()),

('Bella', 'Mukamana', 'female', '1999-02-14', 'Eastern', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe Anglican Church', 'bella.mukamana@faith.rw', '+250789100003', 'student', 'active', 4, 4, 2, NULL, '2027-05-30', 'Mathematics', 'Statistics', 'single', NOW(), NOW()),

('Caleb', 'Nkurunziza', 'male', '1996-11-08', 'Eastern', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma Catholic Church', 'caleb.nkurunziza@faith.rw', '+250789100004', 'student', 'active', 4, 4, 2, NULL, '2024-07-15', 'Physics', 'Quantum Physics', 'single', NOW(), NOW()),

('Diana', 'Uwimana', 'female', '1998-04-30', 'Eastern', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera Methodist Church', 'diana.uwimana@faith.rw', '+250789100005', 'student', 'active', 4, 4, 2, NULL, '2026-12-10', 'Chemistry', 'Organic Chemistry', 'single', NOW(), NOW());

-- Small Group 3 Members (Glory)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Ethan', 'Baptiste', 'male', '1997-07-22', 'Southern', 'Huye', 'Huye', 'Huye', 'Huye', 'Huye Baptist Church', 'ethan.baptiste@glory.rw', '+250789200001', 'student', 'active', 3, 3, 3, NULL, '2025-06-15', 'Computer Science', 'Mobile Development', 'single', NOW(), NOW()),

('Fiona', 'Mukamana', 'female', '1998-10-15', 'Southern', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza', 'Nyanza Presbyterian Church', 'fiona.mukamana@glory.rw', '+250789200002', 'student', 'active', 3, 3, 3, NULL, '2026-08-20', 'Engineering', 'Electrical Engineering', 'single', NOW(), NOW()),

('Gabriel', 'Nkurunziza', 'male', '1996-01-28', 'Southern', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara', 'Gisagara Anglican Church', 'gabriel.nkurunziza@glory.rw', '+250789200003', 'student', 'active', 3, 3, 3, NULL, '2024-05-30', 'Mathematics', 'Applied Mathematics', 'single', NOW(), NOW()),

('Hannah', 'Uwimana', 'female', '1999-05-12', 'Southern', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe', 'Nyamagabe Catholic Church', 'hannah.uwimana@glory.rw', '+250789200004', 'student', 'active', 3, 3, 3, NULL, '2027-07-15', 'Physics', 'Nuclear Physics', 'single', NOW(), NOW()),

('Isaac', 'Baptiste', 'male', '1997-08-05', 'Southern', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango', 'Ruhango Methodist Church', 'isaac.baptiste@glory.rw', '+250789200005', 'student', 'active', 3, 3, 3, NULL, '2025-12-10', 'Chemistry', 'Inorganic Chemistry', 'single', NOW(), NOW());

-- Small Group 4 Members (John)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Jacob', 'Uwimana', 'male', '1998-03-15', 'Kigali', 'Nyarugenge', 'Kacyiru', 'Kacyiru', 'Kacyiru', 'Kacyiru Baptist Church', 'jacob.uwimana@john.rw', '+250789300001', 'student', 'active', 1, 2, 4, NULL, '2026-06-15', 'Computer Science', 'Web Development', 'single', NOW(), NOW()),

('Katherine', 'Baptiste', 'female', '1997-07-22', 'Kigali', 'Gasabo', 'Kimisagara', 'Kimisagara', 'Kimisagara', 'Kimisagara Presbyterian Church', 'katherine.baptiste@john.rw', '+250789300002', 'student', 'active', 1, 2, 4, NULL, '2025-08-20', 'Engineering', 'Software Engineering', 'single', NOW(), NOW()),

('Liam', 'Mukamana', 'male', '1999-11-08', 'Kigali', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro', 'Kicukiro Anglican Church', 'liam.mukamana@john.rw', '+250789300003', 'student', 'active', 1, 2, 4, NULL, '2027-05-30', 'Mathematics', 'Statistics', 'single', NOW(), NOW()),

('Maya', 'Nkurunziza', 'female', '1996-04-12', 'Kigali', 'Nyarugenge', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo', 'Nyamirambo Catholic Church', 'maya.nkurunziza@john.rw', '+250789300004', 'student', 'active', 1, 2, 4, NULL, '2024-07-15', 'Physics', 'Quantum Physics', 'single', NOW(), NOW()),

('Noah', 'Uwimana', 'male', '1998-09-25', 'Kigali', 'Gasabo', 'Remera', 'Remera', 'Remera', 'Remera Methodist Church', 'noah.uwimana@john.rw', '+250789300005', 'student', 'active', 1, 2, 4, NULL, '2026-12-10', 'Chemistry', 'Organic Chemistry', 'single', NOW(), NOW());

-- Small Group 5 Members (Hope)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Olivia', 'Baptiste', 'female', '1997-01-15', 'Eastern', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana', 'Rwamagana Baptist Church', 'olivia.baptiste@hope.rw', '+250789400001', 'student', 'active', 4, 4, 5, NULL, '2025-06-15', 'Computer Science', 'Mobile Development', 'single', NOW(), NOW()),

('Peter', 'Mukamana', 'male', '1998-05-20', 'Eastern', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza', 'Kayonza Presbyterian Church', 'peter.mukamana@hope.rw', '+250789400002', 'student', 'active', 4, 4, 5, NULL, '2026-08-20', 'Engineering', 'Electrical Engineering', 'single', NOW(), NOW()),

('Quinn', 'Nkurunziza', 'female', '1996-08-10', 'Eastern', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe', 'Kirehe Anglican Church', 'quinn.nkurunziza@hope.rw', '+250789400003', 'student', 'active', 4, 4, 5, NULL, '2024-05-30', 'Mathematics', 'Applied Mathematics', 'single', NOW(), NOW()),

('Ryan', 'Uwimana', 'male', '1999-12-03', 'Eastern', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma', 'Ngoma Catholic Church', 'ryan.uwimana@hope.rw', '+250789400004', 'student', 'active', 4, 4, 5, NULL, '2027-07-15', 'Physics', 'Nuclear Physics', 'single', NOW(), NOW()),

('Sophia', 'Baptiste', 'female', '1997-03-18', 'Eastern', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera', 'Bugesera Methodist Church', 'sophia.baptiste@hope.rw', '+250789400005', 'student', 'active', 4, 4, 5, NULL, '2025-12-10', 'Chemistry', 'Inorganic Chemistry', 'single', NOW(), NOW());

-- Small Group 6 Members (Holy)
INSERT INTO `member` (
    `firstname`, `secondname`, `gender`, `birthdate`, 
    `placeOfBirthProvince`, `placeOfBirthDistrict`, `placeOfBirthSector`, 
    `placeOfBirthCell`, `placeOfBirthVillage`, `localChurch`, 
    `email`, `phone`, `type`, `status`, 
    `regionId`, `universityId`, `smallGroupId`, `alumniGroupId`,
    `graduationDate`, `faculty`, `professionalism`, `maritalStatus`,
    `createdAt`, `updatedAt`
) VALUES
('Thomas', 'Mukamana', 'male', '1998-06-12', 'Western', 'Karongi', 'Karongi', 'Karongi', 'Karongi', 'Karongi Baptist Church', 'thomas.mukamana@holy.rw', '+250789500001', 'student', 'active', 5, 5, 6, NULL, '2026-06-15', 'Computer Science', 'Web Development', 'single', NOW(), NOW()),

('Uma', 'Nkurunziza', 'female', '1997-09-25', 'Western', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu', 'Rubavu Presbyterian Church', 'uma.nkurunziza@holy.rw', '+250789500002', 'student', 'active', 5, 5, 6, NULL, '2025-08-20', 'Engineering', 'Software Engineering', 'single', NOW(), NOW()),

('Victor', 'Uwimana', 'male', '1999-02-14', 'Western', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro', 'Rutsiro Anglican Church', 'victor.uwimana@holy.rw', '+250789500003', 'student', 'active', 5, 5, 6, NULL, '2027-05-30', 'Mathematics', 'Statistics', 'single', NOW(), NOW()),

('Wendy', 'Baptiste', 'female', '1996-11-08', 'Western', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu', 'Nyabihu Catholic Church', 'wendy.baptiste@holy.rw', '+250789500004', 'student', 'active', 5, 5, 6, NULL, '2024-07-15', 'Physics', 'Quantum Physics', 'single', NOW(), NOW()),

('Xavier', 'Mukamana', 'male', '1998-04-30', 'Western', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero', 'Ngororero Methodist Church', 'xavier.mukamana@holy.rw', '+250789500005', 'student', 'active', 5, 5, 6, NULL, '2026-12-10', 'Chemistry', 'Organic Chemistry', 'single', NOW(), NOW());

-- =====================================================
-- SUMMARY OF SAMPLE MEMBERS CREATED
-- =====================================================
-- 
-- MEMBERS BY LEVEL:
-- - 5 National Level Members (staff, no specific region/university)
-- - 20 Regional Level Members (5 per existing region: 1,3,4,5)
-- - 20 University Level Members (5 per existing university: 2,3,4,5)
-- - 30 Small Group Level Members (5 per existing small group: 1,2,3,4,5,6)
--
-- TOTAL MEMBERS: 75 members
--
-- This provides sample members that work with your existing
-- organizational structure and demonstrates the hierarchical
-- relationships in your GBUR system.
