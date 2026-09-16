CREATE DATABASE IF NOT EXISTS skillsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillsync;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) NOT NULL DEFAULT '',
  bio VARCHAR(300) NOT NULL DEFAULT '',
  location VARCHAR(100) NOT NULL DEFAULT '',
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME NULL,
  average_rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_location (location),
  KEY idx_users_role_is_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_skill_offered (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'Beginner',
  description VARCHAR(200) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_skill_offered_user_id (user_id),
  KEY idx_user_skill_offered_name (name),
  KEY idx_user_skill_offered_category (category),
  KEY idx_user_skill_offered_level (level),
  KEY idx_user_skill_offered_user_category_level (user_id, category, level),
  CONSTRAINT fk_user_skill_offered_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_skill_wanted (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'Beginner',
  description VARCHAR(200) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_skill_wanted_user_id (user_id),
  KEY idx_user_skill_wanted_name (name),
  KEY idx_user_skill_wanted_category (category),
  KEY idx_user_skill_wanted_level (level),
  KEY idx_user_skill_wanted_user_category_level (user_id, category, level),
  CONSTRAINT fk_user_skill_wanted_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  message VARCHAR(300) NOT NULL DEFAULT '',
  active_pair_key VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_matches_sender_receiver_status (sender_id, receiver_id, status),
  UNIQUE KEY uq_matches_active_pair (active_pair_key),
  KEY idx_matches_sender_status (sender_id, status),
  KEY idx_matches_receiver_status (receiver_id, status),
  KEY idx_matches_sender_receiver (sender_id, receiver_id),
  CONSTRAINT fk_matches_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_matches_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  match_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_match_created (match_id, created_at DESC),
  KEY idx_messages_sender_created (sender_id, created_at DESC),
  CONSTRAINT fk_messages_match
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE message_read_by (
  message_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id, user_id),
  KEY idx_message_read_by_user_id (user_id),
  KEY idx_message_read_by_message_id (message_id),
  CONSTRAINT fk_message_read_by_message
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_message_read_by_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  reviewee_id BIGINT UNSIGNED NOT NULL,
  match_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_reviewer_match (reviewer_id, match_id),
  KEY idx_reviews_reviewee_created (reviewee_id, created_at DESC),
  KEY idx_reviews_reviewer_created (reviewer_id, created_at DESC),
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_match
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(2000) NOT NULL DEFAULT '',
  status ENUM('open', 'in_progress', 'completed', 'archived') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_owner_created (owner_id, created_at DESC),
  KEY idx_projects_status_created (status, created_at DESC),
  CONSTRAINT fk_projects_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_skills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_skills_project_name (project_id, name),
  KEY idx_project_skills_name (name),
  CONSTRAINT fk_project_skills_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
