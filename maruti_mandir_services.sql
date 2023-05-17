-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: localhost    Database: maruti_mandir
-- ------------------------------------------------------
-- Server version	8.0.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `service_id` int(11) NOT NULL AUTO_INCREMENT,
  `service_name` text,
  `service_amount` double DEFAULT NULL,
  `service_deva` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Panchamrutabhishek',10,'पंचामृताभिषेक'),(2,'Abhishek Naivaidhya',10,'अभिषेक नैवेद्य '),(3,'Ekadashni',20,'एकादशनी '),(4,'Vayustutiavartan',51,'वायुस्तुति आवर्तन'),(5,'Vaahan Pooja',101,'वाहन पूजा'),(6,'Pakmaan Panchasuktavartan',20,'पकमान पञ्चसुक्तावर्तन '),(7,'Marutis Manushyasukt Jap',51,'मरुतिस मनुष्यसूक्त जप'),(8,'Deepastamb Aaras',101,'Deepastamb Aaras'),(9,'1 Mahina Jyot',101,'१ महीना ज्योत (३ लीटर तेल व कापुस देने)'),(10,'Laghuvishnu/Laghurudr',151,'लघुविष्णु/लघुरुद्र'),(11,'Shanipradosh',151,'शनिप्रदोष'),(12,'Shree Satyanarayan Pooja',501,'श्री सत्यनारायण पूजा'),(13,'Palkhi Seva',501,'पालखी सेवा'),(14,'Kanuk',501,'कापुक'),(15,'Shanivar Seva',501,'शनिवार सेवा');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-06-25 15:55:48
