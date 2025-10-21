-- =====================================================
-- UPDATE SAMPLE MEMBERS TO STUDENT TYPE ONLY
-- =====================================================
-- This script updates all sample members to be students instead of staff

-- Update National Level Members to Students
UPDATE `member` SET 
    `type` = 'student',
    `status` = 'active',
    `faculty` = 'Theology',
    `professionalism` = 'Student Ministry',
    `graduationDate` = '2025-06-15',
    `updatedAt` = NOW()
WHERE `email` IN (
    'jean.baptiste@gbur.rw',
    'marie.claire@gbur.rw',
    'paul.mukamana@gbur.rw',
    'grace.uwimana@gbur.rw',
    'david.nkurunziza@gbur.rw'
);

-- Update Regional Level Members to Students
UPDATE `member` SET 
    `type` = 'student',
    `status` = 'active',
    `faculty` = 'Education',
    `professionalism` = 'Student Ministry',
    `graduationDate` = '2025-06-15',
    `updatedAt` = NOW()
WHERE `email` LIKE '%@region%.rw';

-- Update University Level Members to Students (already students, just ensure consistency)
UPDATE `member` SET 
    `type` = 'student',
    `status` = 'active',
    `updatedAt` = NOW()
WHERE `email` LIKE '%@university%.rw';

-- Update Small Group Level Members to Students (already students, just ensure consistency)
UPDATE `member` SET 
    `type` = 'student',
    `status` = 'active',
    `updatedAt` = NOW()
WHERE `email` LIKE '%@%.rw' AND `email` NOT LIKE '%@region%.rw' AND `email` NOT LIKE '%@university%.rw' AND `email` NOT LIKE '%@gbur.rw';

-- =====================================================
-- SUMMARY OF UPDATES
-- =====================================================
-- 
-- ALL MEMBERS NOW HAVE:
-- - type: 'student'
-- - status: 'active'
-- - Appropriate graduation dates for students
-- - Student-focused faculty and professionalism fields
--
-- This ensures all sample members are students rather than staff,
-- which better represents the typical GBUR membership base.
