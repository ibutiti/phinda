UPDATE questions
SET status = 'rejected'
WHERE status = 'accepted'
  AND (
    source_ref IS NULL
    OR TRIM(source_ref) = ''
    OR source_ref != 'https://www.education.gov.za/LinkClick.aspx?fileticket=uCNqOwfGbmc%3d&tabid=573&portalid=0&mid=1629&forcedownload=true#page=68'
    OR source_title IS NULL
    OR TRIM(source_title) = ''
    OR source_title != 'Mathematics Grades 7-9 CAPS, Grade 7 Term 4, Topic 1.3: Integers (p. 68)'
    OR generated_from IS NULL
    OR TRIM(generated_from) = ''
    OR generated_from NOT IN (
      'Add and subtract with integers',
      'Solve problems in contexts involving addition and subtraction of integers',
      'Start calculations using integers in small number ranges.',
      'Subtracting an integer is the same as adding its additive inverse.',
      '7 – 4 = 7 + (– 4) = 3 or –7 – 4 = –7 + (– 4) = –11',
      '7 – (– 4) = 7 + (+4) = 11 or –7 – (– 4) = –7 + (+4) = –3'
    )
  );
