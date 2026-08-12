import 'api_client.dart';
import '../models/models.dart';

/// Typed facade over [ApiClient] — one method per backend route, returning
/// parsed models. Screens depend on this, never on raw JSON.
class Api {
  final ApiClient client;
  Api(this.client);

  // ---- Auth ----
  Future<({String token, AppUser user})> login(
      String email, String password) async {
    final res = await client.post('/auth/login',
        {'email': email.trim(), 'password': password});
    return (
      token: res['token'] as String,
      user: AppUser.fromJson(Map<String, dynamic>.from(res['user'])),
    );
  }

  Future<({String token, AppUser user})> register(
      Map<String, dynamic> body) async {
    final res = await client.post('/auth/register', body);
    return (
      token: res['token'] as String,
      user: AppUser.fromJson(Map<String, dynamic>.from(res['user'])),
    );
  }

  // ---- Users / profile ----
  Future<AppUser> me() async =>
      AppUser.fromJson(Map<String, dynamic>.from(await client.get('/users/me')));

  Future<AppUser> updateMe(Map<String, dynamic> body) async => AppUser.fromJson(
      Map<String, dynamic>.from(await client.patch('/users/me', body)));

  Future<List<AppUser>> listStudents() async =>
      (await client.getList('/users')).map(AppUser.fromJson).toList();

  Future<void> enroll(String userId, String batchId) =>
      client.patch('/users/$userId/enroll/$batchId');
  Future<void> unenroll(String userId, String batchId) =>
      client.patch('/users/$userId/unenroll/$batchId');
  Future<void> deleteUser(String id) => client.delete('/users/$id');

  // ---- Batches ----
  Future<List<Batch>> batches({bool all = false}) async =>
      (await client.getList('/batches', query: {if (all) 'all': '1'}))
          .map(Batch.fromJson)
          .toList();

  Future<Batch> batchAuth(String id) async => Batch.fromJson(
      Map<String, dynamic>.from(await client.get('/batches/me/$id')));

  Future<Batch> createBatch(Map<String, dynamic> body) async =>
      Batch.fromJson(Map<String, dynamic>.from(await client.post('/batches', body)));
  Future<Batch> updateBatch(String id, Map<String, dynamic> body) async =>
      Batch.fromJson(
          Map<String, dynamic>.from(await client.patch('/batches/$id', body)));
  Future<void> deleteBatch(String id) => client.delete('/batches/$id');

  // ---- Classes ----
  Future<List<ClassSession>> classes({String? batch}) async =>
      (await client.getList('/classes', query: {'batch': batch}))
          .map(ClassSession.fromJson)
          .toList();

  Future<ClassSession> classAuth(String id) async => ClassSession.fromJson(
      Map<String, dynamic>.from(await client.get('/classes/me/$id')));

  Future<ClassSession> createClass(Map<String, dynamic> body) async =>
      ClassSession.fromJson(
          Map<String, dynamic>.from(await client.post('/classes', body)));
  Future<ClassSession> updateClass(String id, Map<String, dynamic> body) async =>
      ClassSession.fromJson(
          Map<String, dynamic>.from(await client.patch('/classes/$id', body)));
  Future<void> deleteClass(String id) => client.delete('/classes/$id');

  // ---- Resources ----
  Future<List<Resource>> publicResources({String? kind, String? level}) async =>
      (await client.getList('/resources/public',
              query: {'kind': kind, 'level': level}))
          .map(Resource.fromJson)
          .toList();

  Future<List<Resource>> resources(
          {String? kind, String? level, String? batch}) async =>
      (await client.getList('/resources',
              query: {'kind': kind, 'level': level, 'batch': batch}))
          .map(Resource.fromJson)
          .toList();

  Future<Resource> createResource(Map<String, dynamic> body) async =>
      Resource.fromJson(
          Map<String, dynamic>.from(await client.post('/resources', body)));
  Future<Resource> updateResource(String id, Map<String, dynamic> body) async =>
      Resource.fromJson(
          Map<String, dynamic>.from(await client.patch('/resources/$id', body)));
  Future<void> deleteResource(String id) => client.delete('/resources/$id');

  // ---- Exams ----
  Future<List<Exam>> exams({String? batch}) async =>
      (await client.getList('/exams', query: {'batch': batch}))
          .map(Exam.fromJson)
          .toList();

  Future<List<ExamResult>> examResults(String examId) async =>
      (await client.getList('/exams/$examId/results'))
          .map(ExamResult.fromJson)
          .toList();

  Future<List<ExamResult>> myResults() async =>
      (await client.getList('/exams/me/results'))
          .map(ExamResult.fromJson)
          .toList();

  Future<List<ExamResult>> topPerformers({int limit = 5}) async =>
      (await client.getList('/exams/top-performers', query: {'limit': limit}))
          .map(ExamResult.fromJson)
          .toList();

  Future<Exam> createExam(Map<String, dynamic> body) async =>
      Exam.fromJson(Map<String, dynamic>.from(await client.post('/exams', body)));
  Future<Exam> updateExam(String id, Map<String, dynamic> body) async =>
      Exam.fromJson(
          Map<String, dynamic>.from(await client.patch('/exams/$id', body)));
  Future<void> deleteExam(String id) => client.delete('/exams/$id');
  Future<void> addResult(String examId, Map<String, dynamic> body) =>
      client.post('/exams/$examId/results', body);

  // ---- Attendance ----
  Future<List<Attendance>> myAttendance({String? batch}) async =>
      (await client.getList('/attendance/me', query: {'batch': batch}))
          .map(Attendance.fromJson)
          .toList();

  Future<AttendanceStats> myAttendanceStats({String? batch}) async =>
      AttendanceStats.fromJson(Map<String, dynamic>.from(
          await client.get('/attendance/me/stats', query: {'batch': batch})));

  Future<List<Attendance>> attendanceByBatch(String batchId) async =>
      (await client.getList('/attendance/batch/$batchId'))
          .map(Attendance.fromJson)
          .toList();

  Future<void> markAttendance(List<Map<String, dynamic>> records) =>
      client.post('/attendance/mark', {'records': records});

  // ---- Payments ----
  Future<List<Payment>> myPayments() async =>
      (await client.getList('/payments/me')).map(Payment.fromJson).toList();

  Future<List<Payment>> payments({String? status, String? batch}) async =>
      (await client.getList('/payments', query: {'status': status, 'batch': batch}))
          .map(Payment.fromJson)
          .toList();

  Future<Payment> createPayment(Map<String, dynamic> body) async =>
      Payment.fromJson(
          Map<String, dynamic>.from(await client.post('/payments', body)));
  Future<void> approvePayment(String id) => client.patch('/payments/$id/approve');
  Future<void> rejectPayment(String id, {String? note}) =>
      client.patch('/payments/$id/reject', {'note': note});

  // ---- Teachers ----
  Future<List<Teacher>> teachers() async =>
      (await client.getList('/teachers')).map(Teacher.fromJson).toList();
  Future<Teacher> createTeacher(Map<String, dynamic> body) async =>
      Teacher.fromJson(
          Map<String, dynamic>.from(await client.post('/teachers', body)));
  Future<Teacher> updateTeacher(String id, Map<String, dynamic> body) async =>
      Teacher.fromJson(
          Map<String, dynamic>.from(await client.patch('/teachers/$id', body)));
  Future<void> deleteTeacher(String id) => client.delete('/teachers/$id');

  // ---- Learning (curriculum: class -> subject -> unit -> lesson) ----
  // Public, read-only content served from the backend's bundled JSON.
  // Returned as raw maps/lists because the lesson body is loosely structured.
  Future<List<Map<String, dynamic>>> learnClasses() =>
      client.getList('/learn/classes');

  Future<Map<String, dynamic>> learnClass(String classId) async =>
      Map<String, dynamic>.from(await client.get('/learn/$classId'));

  Future<Map<String, dynamic>> learnSubject(
          String classId, String subjectId) async =>
      Map<String, dynamic>.from(await client.get('/learn/$classId/$subjectId'));

  Future<Map<String, dynamic>> learnUnit(
          String classId, String subjectId, String unitId) async =>
      Map<String, dynamic>.from(
          await client.get('/learn/$classId/$subjectId/$unitId'));
}
