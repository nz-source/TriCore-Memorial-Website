CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memorials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  portrait VARCHAR(255) NULL,
  birth_date DATE NOT NULL,
  death_date DATE NOT NULL,
  bio TEXT NULL,
  family_info VARCHAR(255) NULL,
  wake_location VARCHAR(200) NULL,
  wake_address VARCHAR(255) NULL,
  wake_date DATE NULL,
  viewing_hours VARCHAR(120) NULL,
  funeral_church VARCHAR(200) NULL,
  funeral_date DATE NULL,
  funeral_time TIME NULL,
  presider VARCHAR(160) NULL,
  cemetery_type ENUM('catholic','private','public') NOT NULL DEFAULT 'catholic',
  cemetery_name VARCHAR(200) NULL,
  cemetery_address VARCHAR(255) NULL,
  grave_id VARCHAR(120) NULL,
  grave_photo VARCHAR(255) NULL,
  map_link VARCHAR(500) NULL,
  visibility ENUM('public','private') NOT NULL DEFAULT 'public',  -- separate from cemetery_type
  allow_candles TINYINT(1) NOT NULL DEFAULT 1,
  allow_prayers TINYINT(1) NOT NULL DEFAULT 1,
  allow_memories TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (status, visibility), INDEX (cemetery_type), INDEX (funeral_date)
);

CREATE TABLE gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  memorial_id INT NOT NULL,
  file VARCHAR(255) NOT NULL,
  album VARCHAR(60) NOT NULL DEFAULT 'Wake',
  caption VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memorial_id) REFERENCES memorials(id) ON DELETE CASCADE
);

CREATE TABLE candles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  memorial_id INT NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'Anonymous',
  message VARCHAR(500) NULL,
  design TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memorial_id) REFERENCES memorials(id) ON DELETE CASCADE
);

CREATE TABLE prayers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  memorial_id INT NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'Anonymous',
  type ENUM('Prayer','Condolence','Bible verse','Words of comfort') NOT NULL DEFAULT 'Prayer',
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memorial_id) REFERENCES memorials(id) ON DELETE CASCADE
);

CREATE TABLE memories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  memorial_id INT NOT NULL,
  name VARCHAR(120) NOT NULL DEFAULT 'Anonymous',
  story TEXT NOT NULL,
  photo VARCHAR(255) NULL,
  caption VARCHAR(255) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memorial_id) REFERENCES memorials(id) ON DELETE CASCADE,
  INDEX (status)
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  k VARCHAR(60) PRIMARY KEY,
  v VARCHAR(500) NOT NULL
);

INSERT INTO settings (k, v) VALUES
 ('site_name','TriCore Memorial Website'),
 ('hero_title','Forever Remembered, Never Forgotten.'),
 ('tagline','Though they are no longer beside us, their memories will live forever in our hearts.');

-- Default administrator: admin@tricore.local / admin123  (CHANGE THIS PASSWORD after first login)
INSERT INTO users (name, email, password_hash, role) VALUES
 ('Administrator','admin@tricore.local','$2b$10$6KV2beWUk7xRhKw8Nx//.ugxjfaJjA9zJ4spzRw66UKJ.dR4Wuvq.','admin');

-- Sample memorials (from the design mockup)
INSERT INTO memorials (name,birth_date,death_date,bio,wake_location,wake_address,wake_date,viewing_hours,funeral_church,funeral_date,funeral_time,presider,cemetery_type,cemetery_name,cemetery_address,grave_id,visibility,status) VALUES
 ('Chuchay Maragon','1960-01-01','2026-11-15','A beloved parent and neighbor.','Family residence','Isabel, Leyte','2026-11-16','9:00 AM - 9:00 PM','Parish Church','2026-11-20','10:00:00','Fr. Name Surname','catholic','Holy Cross Catholic Cemetery','Isabel, Leyte','Section B, Plot 12','public','published'),
 ('Yocon Mocha','1960-01-01','2026-11-15','','Family residence','Isabel, Leyte','2026-11-16','9:00 AM - 9:00 PM','Parish Church','2026-11-21','09:00:00','Fr. Name Surname','private','Garden Rest Memorial Park','Isabel, Leyte','Garden 3','public','published'),
 ('Mango Ban','1960-01-01','2026-11-15','','Family residence','Isabel, Leyte','2026-11-17','9:00 AM - 9:00 PM','Parish Church','2026-11-22','10:00:00','Fr. Name Surname','public','Municipal Public Cemetery','Isabel, Leyte','Row 4','public','published'),
 ('Mau Rica','1960-01-01','2026-11-15','','Family residence','Isabel, Leyte','2026-11-17','9:00 AM - 9:00 PM','Parish Church','2026-11-22','14:00:00','Fr. Name Surname','private','Garden Rest Memorial Park','Isabel, Leyte','Garden 5','private','published'),
 ('Duday Comcin','1960-01-01','2026-11-15','','','','2026-11-18',NULL,'Parish Church','2026-11-23','10:00:00','Fr. Name Surname','catholic','Holy Cross Catholic Cemetery','Isabel, Leyte','Section C','public','published');

INSERT INTO candles (memorial_id,name,message,design) VALUES (1,'Anonymous','Rest in peace.',1);
INSERT INTO prayers (memorial_id,name,type,message) VALUES (1,'Maria','Prayer','Eternal rest grant unto her, O Lord, and let perpetual light shine upon her.');
INSERT INTO memories (memorial_id,name,story,status) VALUES
 (1,'Ana','I will always remember your kindness, laughter, and the beautiful memories we shared.','approved'),
 (1,'Pedro','You taught me to always share what I have.','pending');
