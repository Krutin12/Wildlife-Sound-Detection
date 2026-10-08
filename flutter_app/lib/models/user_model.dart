import 'dart:convert';

/// User profile model matching the backend UserProfileResponse schema.
class User {
  final int id;
  final String firstName;
  final String lastName;
  final String email;
  final String username;
  final String phoneNumber;
  final String? createdAt;

  const User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.username,
    required this.phoneNumber,
    this.createdAt,
  });

  String get fullName => '$firstName $lastName';

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$f$l';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      username: json['username'] as String? ?? '',
      phoneNumber: json['phone_number'] as String? ?? '',
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'username': username,
    'phone_number': phoneNumber,
    'created_at': createdAt,
  };

  /// Serialize to a JSON string for local storage.
  String toJsonString() => jsonEncode(toJson());

  /// Deserialize from a stored JSON string.
  factory User.fromJsonString(String source) =>
      User.fromJson(jsonDecode(source) as Map<String, dynamic>);
}
