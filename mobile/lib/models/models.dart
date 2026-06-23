/// Plain data models mirroring the NestJS backend schemas.
///
/// All `fromJson` parsers are defensive: the backend returns raw Mongoose
/// documents, so ids may arrive as `_id`, dates as ISO strings, and refs as
/// either an id string or a populated object.
library;

/// Pull a Mongo id out of a value that may be a String, a {_id} object, or null.
String? idOf(dynamic v) {
  if (v == null) return null;
  if (v is String) return v;
  if (v is Map) return (v['_id'] ?? v['id'])?.toString();
  return v.toString();
}

DateTime? _date(dynamic v) {
  if (v == null) return null;
  if (v is String) return DateTime.tryParse(v)?.toLocal();
  return null;
}

double _toDouble(dynamic v) =>
    v == null ? 0 : (v is num ? v.toDouble() : double.tryParse('$v') ?? 0);

int _toInt(dynamic v) =>
    v == null ? 0 : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);

class AppUser {
  final String id;
  final String name;
  final String email;
  final String role; // 'admin' | 'student'
  final String? phone;
  final String? institution;
  final String? level; // SSC | HSC | Other
  final String? address;
  final List<String> enrolledBatches;
  final bool active;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.institution,
    this.level,
    this.address,
    this.enrolledBatches = const [],
    this.active = true,
  });

  bool get isAdmin => role == 'admin';

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: idOf(j['id'] ?? j['_id']) ?? '',
        name: j['name'] ?? '',
        email: j['email'] ?? '',
        role: j['role'] ?? 'student',
        phone: j['phone'],
        institution: j['institution'],
        level: j['level'],
        address: j['address'],
        enrolledBatches: ((j['enrolledBatches'] ?? []) as List)
            .map((e) => idOf(e) ?? '')
            .where((e) => e.isNotEmpty)
            .toList(),
        active: j['active'] ?? true,
      );
}

class ScheduleSlot {
  final String day;
  final String startTime;
  final String endTime;
  ScheduleSlot(
      {required this.day, required this.startTime, required this.endTime});
  factory ScheduleSlot.fromJson(Map<String, dynamic> j) => ScheduleSlot(
        day: j['day'] ?? '',
        startTime: j['startTime'] ?? '',
        endTime: j['endTime'] ?? '',
      );
  Map<String, dynamic> toJson() =>
      {'day': day, 'startTime': startTime, 'endTime': endTime};
  @override
  String toString() => '$day $startTime–$endTime';
}

class Batch {
  final String id;
  final String name;
  final String? nameBn;
  final String code;
  final String type; // premium | general
  final String subject;
  final String? description;
  final String? descriptionBn;
  final double monthlyFee;
  final int maxStudents;
  final int enrolledCount;
  final List<ScheduleSlot> schedule;
  final String? gmeetLink; // only present when enrolled/admin
  final DateTime? startDate;
  final int freeClassCount;
  final bool active;

  Batch({
    required this.id,
    required this.name,
    this.nameBn,
    required this.code,
    required this.type,
    required this.subject,
    this.description,
    this.descriptionBn,
    required this.monthlyFee,
    required this.maxStudents,
    this.enrolledCount = 0,
    this.schedule = const [],
    this.gmeetLink,
    this.startDate,
    this.freeClassCount = 3,
    this.active = true,
  });

  String get subjectLabel => switch (subject) {
        'HSC_ENGLISH_1ST' => 'HSC English 1st',
        'HSC_ENGLISH_2ND' => 'HSC English 2nd',
        'SSC_ENGLISH_1ST' => 'SSC English 1st',
        'SSC_ENGLISH_2ND' => 'SSC English 2nd',
        'ICT' => 'ICT',
        _ => subject,
      };

  factory Batch.fromJson(Map<String, dynamic> j) => Batch(
        id: idOf(j['_id'] ?? j['id']) ?? '',
        name: j['name'] ?? '',
        nameBn: j['nameBn'],
        code: j['code'] ?? '',
        type: j['type'] ?? 'general',
        subject: j['subject'] ?? '',
        description: j['description'],
        descriptionBn: j['descriptionBn'],
        monthlyFee: _toDouble(j['monthlyFee']),
        maxStudents: _toInt(j['maxStudents']),
        enrolledCount: _toInt(j['enrolledCount']),
        schedule: ((j['schedule'] ?? []) as List)
            .map((e) => ScheduleSlot.fromJson(e as Map<String, dynamic>))
            .toList(),
        gmeetLink: j['gmeetLink'],
        startDate: _date(j['startDate']),
        freeClassCount: _toInt(j['freeClassCount']),
        active: j['active'] ?? true,
      );
}

class ClassSession {
  final String id;
  final String batchId;
  final String title;
  final String? titleBn;
  final String? topic;
  final String? topicBn;
  final DateTime? scheduledAt;
  final int durationMinutes;
  final String? gmeetLink; // only when enrolled/admin
  final String status; // scheduled | live | completed | cancelled
  final String? recordingUrl;
  final String? notes;

  ClassSession({
    required this.id,
    required this.batchId,
    required this.title,
    this.titleBn,
    this.topic,
    this.topicBn,
    this.scheduledAt,
    this.durationMinutes = 90,
    this.gmeetLink,
    this.status = 'scheduled',
    this.recordingUrl,
    this.notes,
  });

  factory ClassSession.fromJson(Map<String, dynamic> j) => ClassSession(
        id: idOf(j['_id'] ?? j['id']) ?? '',
        batchId: idOf(j['batch']) ?? '',
        title: j['title'] ?? '',
        titleBn: j['titleBn'],
        topic: j['topic'],
        topicBn: j['topicBn'],
        scheduledAt: _date(j['scheduledAt']),
        durationMinutes: _toInt(j['durationMinutes']),
        gmeetLink: j['gmeetLink'],
        status: j['status'] ?? 'scheduled',
        recordingUrl: j['recordingUrl'],
        notes: j['notes'],
      );
}

class Resource {
  final String id;
  final String title;
  final String? titleBn;
  final String kind; // lecture_sheet|tips|hack|note|suggestion|best_practice
  final String level; // SSC|HSC|BOTH
  final String? subject;
  final String? body;
  final String? bodyBn;
  final String? fileUrl;
  final String? batchId;
  final bool isPublic;
  final List<String> tags;
  final DateTime? createdAt;

  Resource({
    required this.id,
    required this.title,
    this.titleBn,
    required this.kind,
    this.level = 'BOTH',
    this.subject,
    this.body,
    this.bodyBn,
    this.fileUrl,
    this.batchId,
    this.isPublic = true,
    this.tags = const [],
    this.createdAt,
  });

  String get kindLabel => switch (kind) {
        'lecture_sheet' => 'Lecture Sheet',
        'tips' => 'Tips',
        'hack' => 'Hack',
        'note' => 'Note',
        'suggestion' => 'Suggestion',
        'best_practice' => 'Best Practice',
        _ => kind,
      };

  factory Resource.fromJson(Map<String, dynamic> j) => Resource(
        id: idOf(j['_id'] ?? j['id']) ?? '',
        title: j['title'] ?? '',
        titleBn: j['titleBn'],
        kind: j['kind'] ?? 'note',
        level: j['level'] ?? 'BOTH',
        subject: j['subject'],
        body: j['body'],
        bodyBn: j['bodyBn'],
        fileUrl: j['fileUrl'],
        batchId: idOf(j['batch']),
        isPublic: j['isPublic'] ?? true,
        tags:
            ((j['tags'] ?? []) as List).map((e) => e.toString()).toList(),
        createdAt: _date(j['createdAt']),
      );
}

class Exam {
  final String id;
  final String batchId;
  final String title;
  final String? titleBn;
  final String? description;
  final DateTime? scheduledAt;
  final int durationMinutes;
  final int totalMarks;
  final String? googleFormUrl;
  final String status; // scheduled|open|closed|evaluated

  Exam({
    required this.id,
    required this.batchId,
    required this.title,
    this.titleBn,
    this.description,
    this.scheduledAt,
    this.durationMinutes = 60,
    this.totalMarks = 100,
    this.googleFormUrl,
    this.status = 'scheduled',
  });

  factory Exam.fromJson(Map<String, dynamic> j) => Exam(
        id: idOf(j['_id'] ?? j['id']) ?? '',
        batchId: idOf(j['batch']) ?? '',
        title: j['title'] ?? '',
        titleBn: j['titleBn'],
        description: j['description'],
        scheduledAt: _date(j['scheduledAt']),
        durationMinutes: _toInt(j['durationMinutes']),
        totalMarks: _toInt(j['totalMarks']),
        googleFormUrl: j['googleFormUrl'],
        status: j['status'] ?? 'scheduled',
      );
}

class ExamResult {
  final String id;
  final String examId;
  final String studentId;
  final String? studentName;
  final String batchId;
  final double marks;
  final double totalMarks;
  final int? rank;
  final String? remark;
  final Exam? exam; // populated on /me/results

  ExamResult({
    required this.id,
    required this.examId,
    required this.studentId,
    this.studentName,
    required this.batchId,
    required this.marks,
    required this.totalMarks,
    this.rank,
    this.remark,
    this.exam,
  });

  double get percent => totalMarks == 0 ? 0 : (marks / totalMarks) * 100;

  factory ExamResult.fromJson(Map<String, dynamic> j) {
    final examRaw = j['exam'];
    final studentRaw = j['student'];
    return ExamResult(
      id: idOf(j['_id'] ?? j['id']) ?? '',
      examId: idOf(examRaw) ?? '',
      studentId: idOf(studentRaw) ?? '',
      studentName: studentRaw is Map ? studentRaw['name'] : null,
      batchId: idOf(j['batch']) ?? '',
      marks: _toDouble(j['marks']),
      totalMarks: _toDouble(j['totalMarks']),
      rank: j['rank'] == null ? null : _toInt(j['rank']),
      remark: j['remark'],
      exam: examRaw is Map
          ? Exam.fromJson(Map<String, dynamic>.from(examRaw))
          : null,
    );
  }
}

class Attendance {
  final String id;
  final String classSessionId;
  final String batchId;
  final String studentId;
  final String? studentName;
  final String status; // present|absent|late
  final String? remark;

  Attendance({
    required this.id,
    required this.classSessionId,
    required this.batchId,
    required this.studentId,
    this.studentName,
    required this.status,
    this.remark,
  });

  factory Attendance.fromJson(Map<String, dynamic> j) {
    final studentRaw = j['student'];
    return Attendance(
      id: idOf(j['_id'] ?? j['id']) ?? '',
      classSessionId: idOf(j['classSession']) ?? '',
      batchId: idOf(j['batch']) ?? '',
      studentId: idOf(studentRaw) ?? '',
      studentName: studentRaw is Map ? studentRaw['name'] : null,
      status: j['status'] ?? 'absent',
      remark: j['remark'],
    );
  }
}

class AttendanceStats {
  final int total;
  final int present;
  final int absent;
  final int late;
  AttendanceStats(
      {this.total = 0, this.present = 0, this.absent = 0, this.late = 0});

  double get rate => total == 0 ? 0 : ((present + late) / total) * 100;

  factory AttendanceStats.fromJson(Map<String, dynamic> j) => AttendanceStats(
        total: _toInt(j['total']),
        present: _toInt(j['present']),
        absent: _toInt(j['absent']),
        late: _toInt(j['late']),
      );
}

class Payment {
  final String id;
  final String studentId;
  final String? studentName;
  final String batchId;
  final double amount;
  final String month; // YYYY-MM
  final String method; // bkash|nagad|rocket|cash
  final String transactionId;
  final String senderNumber;
  final String status; // pending|approved|rejected
  final String? note;
  final DateTime? createdAt;

  Payment({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.batchId,
    required this.amount,
    required this.month,
    required this.method,
    required this.transactionId,
    required this.senderNumber,
    required this.status,
    this.note,
    this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> j) {
    final studentRaw = j['student'];
    return Payment(
      id: idOf(j['_id'] ?? j['id']) ?? '',
      studentId: idOf(studentRaw) ?? '',
      studentName: studentRaw is Map ? studentRaw['name'] : null,
      batchId: idOf(j['batch']) ?? '',
      amount: _toDouble(j['amount']),
      month: j['month'] ?? '',
      method: j['method'] ?? 'bkash',
      transactionId: j['transactionId'] ?? '',
      senderNumber: j['senderNumber'] ?? '',
      status: j['status'] ?? 'pending',
      note: j['note'],
      createdAt: _date(j['createdAt']),
    );
  }
}

class Teacher {
  final String id;
  final String name;
  final String? nameBn;
  final String designation;
  final String? bio;
  final String? photoUrl;
  final List<String> subjects;
  final String? qualification;
  final int? experienceYears;

  Teacher({
    required this.id,
    required this.name,
    this.nameBn,
    required this.designation,
    this.bio,
    this.photoUrl,
    this.subjects = const [],
    this.qualification,
    this.experienceYears,
  });

  factory Teacher.fromJson(Map<String, dynamic> j) => Teacher(
        id: idOf(j['_id'] ?? j['id']) ?? '',
        name: j['name'] ?? '',
        nameBn: j['nameBn'],
        designation: j['designation'] ?? '',
        bio: j['bio'],
        photoUrl: j['photoUrl'],
        subjects:
            ((j['subjects'] ?? []) as List).map((e) => e.toString()).toList(),
        qualification: j['qualification'],
        experienceYears:
            j['experienceYears'] == null ? null : _toInt(j['experienceYears']),
      );
}

/// Client-side notification feed item (the backend has no notification API,
/// so these are synthesized from classes, resources, exams and payments).
enum NotifType { classUpcoming, resource, examResult, payment, exam }

class AppNotification {
  final NotifType type;
  final String title;
  final String body;
  final DateTime? when;
  final IconKey icon;

  AppNotification({
    required this.type,
    required this.title,
    required this.body,
    this.when,
    required this.icon,
  });
}

enum IconKey { classroom, book, trophy, money, edit, bell }
